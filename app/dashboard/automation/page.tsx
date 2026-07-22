import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import FallbackRulesList from "@/components/automation/FallbackRulesList";

export default async function AutomationPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const fallbackRules = await prisma.fallbackRule.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="font-display text-3xl" style={{ color: "var(--text)" }}>Cross-channel automation</h1>
          <p className="mt-1" style={{ color: "var(--text-muted)" }}>Create intelligent fallback rules to maximize delivery</p>
        </div>
        <Link
          href="/dashboard/automation/new"
          className="px-5 py-2.5 rounded-full text-sm font-medium transition hover:brightness-110"
          style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
        >
          Create fallback rule
        </Link>
      </div>

      <div className="rounded-2xl border p-6" style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.2)" }}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(139,92,246,0.15)" }}>
            <i className="bi bi-arrow-repeat" style={{ color: "var(--primary)", fontSize: 18 }} />
          </div>
          <div>
            <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>What are fallback rules?</h3>
            <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
              Fallback rules automatically send your message on a different channel if the primary channel fails or doesn&apos;t engage the recipient — maximizing delivery and engagement. Attach a rule to a campaign when you create it.
            </p>
            <div className="space-y-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
              <p><strong style={{ color: "var(--whatsapp)" }}>WhatsApp</strong> → undelivered after 10 min → <strong style={{ color: "var(--sms)" }}>SMS</strong></p>
              <p><strong style={{ color: "var(--email)" }}>Email</strong> → bounced → <strong style={{ color: "var(--sms)" }}>SMS</strong></p>
              <p><strong style={{ color: "var(--whatsapp)" }}>WhatsApp</strong> → unread after 30 min → <strong style={{ color: "var(--sms)" }}>SMS</strong></p>
            </div>
          </div>
        </div>
      </div>

      <FallbackRulesList rules={fallbackRules} />
    </div>
  );
}