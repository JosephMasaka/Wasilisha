import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import Link from "next/link";
import WalletCard from "@/components/WalletCard";

const statusColor: Record<string, string> = {
  success: "var(--whatsapp)",
  pending: "var(--sms)",
  failed: "#f87171",
};

const channelMeta: Record<string, { color: string; label: string }> = {
  sms: { color: "var(--sms)", label: "SMS" },
  email: { color: "var(--email)", label: "Email" },
  whatsapp: { color: "var(--whatsapp)", label: "WhatsApp" },
};

const LOW_BALANCE_THRESHOLD = 500;

function timeAgo(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function TxIcon({ isTopup, channel }: { isTopup: boolean; channel?: string }) {
  if (isTopup) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16" />
      </svg>
    );
  }
  if (channel === "email") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18v12H3z" /><path d="M3 7l9 6 9-6" />
      </svg>
    );
  }
  if (channel === "whatsapp") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.5 8.5 0 01-12.3 7.6L3 20l1-5.4A8.5 8.5 0 1121 11.5z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h18v14H3z" /><path d="M7 9h10M7 13h6" />
    </svg>
  );
}

export default async function DashboardPage() {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      redirect("/auth/signin");
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      include: {
        walletTransactions: { orderBy: { createdAt: "desc" }, take: 6 },
      },
    });
    if (!company) redirect("/auth/signin");

    const [contactCount, campaignCount, deliveredCount, channelBreakdown] =
      await prisma.$transaction([
        prisma.contact.count({ where: { companyId: session.user.companyId } }),
        prisma.campaign.count({ where: { companyId: session.user.companyId } }),
        prisma.message.count({
          where: { campaign: { companyId: session.user.companyId }, status: "delivered" },
        }),
        prisma.message.groupBy({
          by: ["channel"],
          where: { campaign: { companyId: session.user.companyId }, status: "delivered" },
          _count: { _all: true },
        }),
      ], {
        timeout: 10000, // 10 second timeout
      });

    const stats = [
      { label: "Total contacts", value: contactCount, accent: "var(--primary)", href: "/dashboard/contacts" },
      { label: "Campaigns", value: campaignCount, accent: "var(--warm)", href: "/dashboard/campaigns" },
      { label: "Messages delivered", value: deliveredCount, accent: "var(--whatsapp)", href: "/dashboard/analytics" },
    ];

    const quickActions = [
      { label: "New campaign", href: "/dashboard/campaigns/new", icon: "M12 4v16m8-8H4" },
      { label: "Add contacts", href: "/dashboard/contacts", icon: "M16 19h6v-1a4 4 0 00-3-3.87M8 19H2v-1a4 4 0 013-3.87m7-1.13a4 4 0 10-4-4 4 4 0 004 4z" },
      { label: "Top up wallet", href: "#wallet", icon: "M12 4v12m0 0l-5-5m5 5l5-5M4 20h16" },
    ];

    const balance = Number(company.walletBalance);
    const isLowBalance = balance < LOW_BALANCE_THRESHOLD;

    const totalDelivered = channelBreakdown.reduce((sum, c) => sum + c._count._all, 0);

    return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl" style={{ color: "var(--text)" }}>
            Dashboard
          </h1>
          <p className="mt-1" style={{ color: "var(--text-muted)" }}>
            Welcome back, {session.user.companyName}
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="px-5 py-2.5 rounded-full text-sm font-medium transition hover:brightness-110"
          style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
        >
          New campaign
        </Link>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition hover:border-white/20"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={a.icon} />
            </svg>
            {a.label}
          </Link>
        ))}
      </div>

      <div id="wallet">
        <WalletCard balance={company.walletBalance.toString()} companyId={company.id} />
        {isLowBalance && (
          <div
            className="flex items-center justify-between gap-4 mt-3 px-4 py-3 rounded-xl border text-sm"
            style={{ background: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.3)", color: "var(--sms)" }}
          >
            <span>Your balance is running low — top up to avoid interrupted sends.</span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl p-6 border transition hover:border-white/20 block"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div
              className="h-1 w-8 rounded-full mb-4"
              style={{ background: s.accent, boxShadow: `0 0 10px 1px ${s.accent}` }}
            />
            <div className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              {s.label}
            </div>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-semibold" style={{ color: "var(--text)" }}>
                {s.value.toLocaleString()}
              </div>
              <span className="text-xs mb-1" style={{ color: "var(--text-faint)" }}>
                View all →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Channel breakdown */}
      {totalDelivered > 0 && (
        <div
          className="rounded-2xl border p-6"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-muted)" }}>
            Delivered by channel
          </h2>
          <div className="flex h-2 w-full rounded-full overflow-hidden mb-4" style={{ background: "var(--surface-2)" }}>
            {channelBreakdown.map((c) => (
              <div
                key={c.channel}
                style={{
                  width: `${(c._count._all / totalDelivered) * 100}%`,
                  background: channelMeta[c.channel]?.color ?? "var(--text-faint)",
                }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-5">
            {channelBreakdown.map((c) => (
              <div key={c.channel} className="flex items-center gap-2 text-sm">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: channelMeta[c.channel]?.color ?? "var(--text-faint)" }}
                />
                <span style={{ color: "var(--text-muted)" }}>
                  {channelMeta[c.channel]?.label ?? c.channel}
                </span>
                <span style={{ color: "var(--text)" }}>{c._count._all.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
            Recent transactions
          </h2>
          <Link href="/dashboard/usage" className="text-sm hover:underline" style={{ color: "var(--primary)" }}>
            View all
          </Link>
        </div>
        <div className="px-6 py-2">
          {company.walletTransactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm mb-4" style={{ color: "var(--text-faint)" }}>
                No transactions yet — top-ups and message sends will show up here.
              </p>
              <a
                href="#wallet"
                className="inline-block px-5 py-2 rounded-full text-sm font-medium transition hover:brightness-110"
                style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
              >
                Top up wallet
              </a>
            </div>
          ) : (
            <div>
              {company.walletTransactions.map((tx, i) => {
                const isTopup = tx.type === "topup";
                return (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center py-4"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: "var(--surface-2)",
                          color: isTopup ? "var(--whatsapp)" : channelMeta[tx.channel]?.color ?? "var(--text-muted)",
                        }}
                      >
                        <TxIcon isTopup={isTopup} channel={tx.channel} />
                      </div>
                      <div>
                        <div className="font-medium text-sm" style={{ color: "var(--text)" }}>
                          {isTopup ? "Wallet top-up" : `${channelMeta[tx.channel]?.label ?? tx.channel} message`}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                          {timeAgo(new Date(tx.createdAt))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{ color: statusColor[tx.status] ?? "var(--text-muted)", background: "var(--surface-2)" }}
                      >
                        {tx.status}
                      </span>
                      <span
                        className="font-semibold text-sm"
                        style={{ color: isTopup ? "var(--whatsapp)" : "var(--text)" }}
                      >
                        {isTopup ? "+" : "-"}KES {tx.amountKes.toString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    throw error; // Let the error boundary handle it
  }
}