"use client";

import { SubscriptionPlan } from "@prisma/client";

interface PlanCardProps {
  plan: SubscriptionPlan;
  currentPlan: SubscriptionPlan | null;
  onSelect: () => void;
  loading: boolean;
}

export default function PlanCard({ plan, currentPlan, onSelect, loading }: PlanCardProps) {
  const isCurrentPlan = currentPlan?.id === plan.id;
  const isPopular = plan.name === "Growth";

  return (
    <div
      className="relative rounded-2xl border p-6"
      style={{
        background: isPopular ? "var(--surface-2)" : "var(--surface)",
        borderColor: isPopular ? "var(--primary)" : isCurrentPlan ? "var(--whatsapp)" : "var(--border)",
        boxShadow: isPopular ? "0 0 0 1px var(--primary), 0 20px 40px -20px var(--primary-glow)" : "none",
      }}
    >
      {isPopular && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-medium px-3 py-1 rounded-full"
          style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
        >
          Most popular
        </span>
      )}
      {isCurrentPlan && (
        <span
          className="absolute top-4 right-4 text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ background: "rgba(52,211,153,0.12)", color: "var(--whatsapp)" }}
        >
          Current
        </span>
      )}

      <div className="text-center mb-6">
        <h3 className="font-display text-xl mb-2" style={{ color: "var(--text)" }}>{plan.name}</h3>
        <div className="flex items-baseline justify-center">
          <span className="font-display text-3xl" style={{ color: "var(--text)" }}>KES {plan.monthlyPriceKes.toLocaleString()}</span>
          <span className="ml-1.5 text-sm" style={{ color: "var(--text-faint)" }}>/mo</span>
        </div>
      </div>

      <div className="space-y-2.5 mb-6">
        {[
          { label: "SMS credits", value: plan.includedSmsCredits, color: "var(--sms)" },
          { label: "Email credits", value: plan.includedEmailCredits, color: "var(--email)" },
          { label: "WhatsApp credits", value: plan.includedWhatsappCredits, color: "var(--whatsapp)" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: row.color }} />
              {row.label}
            </span>
            <span className="font-medium" style={{ color: "var(--text)" }}>{row.value.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="pt-4 mb-6 border-t" style={{ borderColor: "var(--border)" }}>
        <p className="text-xs mb-2" style={{ color: "var(--text-faint)" }}>Overage rates</p>
        <div className="space-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
          <div className="flex justify-between"><span>SMS</span><span>KES {plan.overageRateSms.toString()}</span></div>
          <div className="flex justify-between"><span>Email</span><span>KES {plan.overageRateEmail.toString()}</span></div>
          <div className="flex justify-between"><span>WhatsApp</span><span>KES {plan.overageRateWhatsapp.toString()}</span></div>
        </div>
      </div>

      <button
        onClick={onSelect}
        disabled={loading || isCurrentPlan}
        className="w-full py-3 rounded-lg font-medium text-sm transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        style={
          isCurrentPlan
            ? { background: "var(--surface-2)", color: "var(--text-faint)" }
            : { background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }
        }
      >
        {isCurrentPlan ? "Current plan" : currentPlan ? "Switch to this plan" : "Select plan"}
      </button>
    </div>
  );
}