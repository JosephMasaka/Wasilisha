"use client";

interface SerializedPlan {
  id: string;
  name: string;
  includedSmsCredits: number;
  includedEmailCredits: number;
  includedWhatsappCredits: number;
}

interface UsageDisplayProps {
  plan: SerializedPlan | null;
  usage: { sms: number; email: number; whatsapp: number };
  status: string;
  walletBalance: string;
}

const statusMeta: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: "var(--whatsapp)", bg: "rgba(52,211,153,0.12)", label: "Active" },
  past_due: { color: "#f87171", bg: "rgba(239,68,68,0.12)", label: "Past due" },
  cancelled: { color: "var(--text-muted)", bg: "var(--surface-2)", label: "Cancelled" },
  none: { color: "var(--primary)", bg: "rgba(139,92,246,0.12)", label: "Pay-as-you-go" },
};

const channelMeta = [
  { key: "sms" as const, name: "SMS", color: "var(--sms)" },
  { key: "email" as const, name: "Email", color: "var(--email)" },
  { key: "whatsapp" as const, name: "WhatsApp", color: "var(--whatsapp)" },
];

export default function UsageDisplay({ plan, usage, status, walletBalance }: UsageDisplayProps) {
  const s = statusMeta[status] ?? statusMeta.none;
  const totalMessages = usage.sms + usage.email + usage.whatsapp;

  return (
    <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
        <div>
          <h2 className="font-display text-xl mb-1" style={{ color: "var(--text)" }}>Current usage</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {plan
              ? <>This month&apos;s credit usage for the {plan.name} plan</>
              : <>This month&apos;s messages, billed from your wallet</>}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.color }}>
          {s.label}
        </span>
      </div>

      {/* No plan: pay-as-you-go explainer + wallet balance */}
      {!plan && (
        <div
          className="flex items-start gap-3 rounded-xl p-4 mb-6 border"
          style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.2)" }}
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(139,92,246,0.15)" }}>
            <i className="bi bi-wallet2" style={{ color: "var(--primary)", fontSize: 15 }} />
          </div>
          <div>
            <p className="text-sm" style={{ color: "var(--text)" }}>
              You&apos;re not on a subscription plan — every message is billed straight from your wallet.
            </p>
            <p className="text-sm mt-1">
              <span style={{ color: "var(--text-faint)" }}>Wallet balance: </span>
              <span className="font-semibold" style={{ color: "var(--text)" }}>KES {Number(walletBalance).toLocaleString()}</span>
            </p>
          </div>
        </div>
      )}

      {totalMessages === 0 ? (
        <div className="text-center py-8">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "var(--surface-2)" }}>
            <i className="bi bi-send" style={{ color: "var(--text-faint)", fontSize: 18 }} />
          </div>
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            No messages sent yet this month.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {channelMeta.map((c) => {
            const used = usage[c.key];
            const included = plan
              ? c.key === "sms"
                ? plan.includedSmsCredits
                : c.key === "email"
                ? plan.includedEmailCredits
                : plan.includedWhatsappCredits
              : 0;

            // No plan, or a plan with 0 included credits for this channel:
            // there's nothing to show progress against, so render a plain
            // count instead of a bar that would divide by zero.
            if (!plan || included === 0) {
              return (
                <div key={c.name} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                    <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{c.name}</span>
                  </div>
                  <div className="text-2xl font-semibold" style={{ color: "var(--text)" }}>
                    {used.toLocaleString()}
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                    {used === 0 ? "sent this month" : "billed at wallet rate"}
                  </p>
                </div>
              );
            }

            const percentage = Math.min((used / included) * 100, 100);
            const isOverage = used > included;
            const overage = isOverage ? used - included : 0;
            const barColor = isOverage ? "#f87171" : percentage > 80 ? "var(--sms)" : c.color;

            return (
              <div key={c.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--text)" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                    {c.name}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                    {used.toLocaleString()} / {included.toLocaleString()}
                  </span>
                </div>
                <div className="w-full rounded-full h-2" style={{ background: "var(--surface-2)" }}>
                  <div className="h-2 rounded-full transition-all" style={{ width: `${percentage}%`, background: barColor }} />
                </div>
                {isOverage && (
                  <p className="text-xs" style={{ color: "#fca5a5" }}>{overage.toLocaleString()} overage messages</p>
                )}
                {!isOverage && percentage > 80 && (
                  <p className="text-xs" style={{ color: "var(--sms)" }}>{(included - used).toLocaleString()} remaining</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}