"use client";

import { SubscriptionPlan } from "@prisma/client";

interface UsageDisplayProps {
  plan: SubscriptionPlan;
  usage: { sms: number; email: number; whatsapp: number };
  status: string;
}

const statusMeta: Record<string, { color: string; bg: string }> = {
  active: { color: "var(--whatsapp)", bg: "rgba(52,211,153,0.12)" },
  past_due: { color: "#f87171", bg: "rgba(239,68,68,0.12)" },
  cancelled: { color: "var(--text-muted)", bg: "var(--surface-2)" },
  none: { color: "var(--text-muted)", bg: "var(--surface-2)" },
};

export default function UsageDisplay({ plan, usage, status }: UsageDisplayProps) {
  const channels = [
    { name: "SMS", used: usage.sms, included: plan.includedSmsCredits, color: "var(--sms)" },
    { name: "Email", used: usage.email, included: plan.includedEmailCredits, color: "var(--email)" },
    { name: "WhatsApp", used: usage.whatsapp, included: plan.includedWhatsappCredits, color: "var(--whatsapp)" },
  ];
  const s = statusMeta[status] ?? statusMeta.none;

  return (
    <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="font-display text-xl mb-1" style={{ color: "var(--text)" }}>Current usage</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>This month&apos;s credit usage for the {plan.name} plan</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: s.bg, color: s.color }}>
          {(status || "none").toUpperCase()}
        </span>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {channels.map((c) => {
          const percentage = Math.min((c.used / c.included) * 100, 100);
          const isOverage = c.used > c.included;
          const overage = isOverage ? c.used - c.included : 0;
          const barColor = isOverage ? "#f87171" : percentage > 80 ? "var(--sms)" : c.color;
          return (
            <div key={c.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--text)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </span>
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                  {c.used.toLocaleString()} / {c.included.toLocaleString()}
                </span>
              </div>
              <div className="w-full rounded-full h-2" style={{ background: "var(--surface-2)" }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(percentage, 100)}%`, background: barColor }} />
              </div>
              {isOverage && <p className="text-xs" style={{ color: "#fca5a5" }}>{overage.toLocaleString()} overage messages</p>}
              {!isOverage && percentage > 80 && <p className="text-xs" style={{ color: "var(--sms)" }}>{(c.included - c.used).toLocaleString()} remaining</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}