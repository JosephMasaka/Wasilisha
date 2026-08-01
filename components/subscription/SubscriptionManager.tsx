"use client";

import { Company, SubscriptionPlan } from "@prisma/client";
import { useState } from "react";
import PlanCard from "./PlanCard";
import UsageDisplay from "./UsageDisplay";

export type SerializedPlan = Omit<SubscriptionPlan, "overageRateSms" | "overageRateEmail" | "overageRateWhatsapp"> & {
  overageRateSms: string;
  overageRateEmail: string;
  overageRateWhatsapp: string;
};

type SerializedCompany = Omit<Company, "walletBalance" | "subscriptionPlan"> & {
  walletBalance: string;
  subscriptionPlan: SerializedPlan | null;
};

interface SubscriptionManagerProps {
  company: SerializedCompany;
  plans: SerializedPlan[];
  usage: { sms: number; email: number; whatsapp: number };
}

export default function SubscriptionManager({ company, plans, usage }: SubscriptionManagerProps) {
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentPlan = company.subscriptionPlan;

  const handleSelectPlan = async (planId: string) => {
    setError("");
    setSuccess("");
    setLoadingPlanId(planId);
    try {
      const res = await fetch("/api/subscription/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to subscribe");

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setSuccess("Plan updated. Refreshing…");
        setTimeout(() => window.location.reload(), 900);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoadingPlanId(null);
    }
  };

  const handleCancelPlan = async () => {
    setShowCancelConfirm(false);
    setError("");
    setSuccess("");
    setCancelLoading(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel subscription");
      setSuccess("Subscription canceled. Refreshing…");
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div
          className="text-sm p-4 rounded-lg border flex items-start gap-2.5"
          style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", color: "#fca5a5" }}
        >
          <i className="bi bi-exclamation-circle-fill mt-0.5" style={{ fontSize: 13 }} />
          {error}
        </div>
      )}

      {success && (
        <div
          className="text-sm p-4 rounded-lg border flex items-center gap-2.5"
          style={{ background: "rgba(52,211,153,0.08)", borderColor: "rgba(52,211,153,0.25)", color: "var(--whatsapp)" }}
        >
          <i className="bi bi-check-circle-fill" style={{ fontSize: 13 }} />
          {success}
        </div>
      )}

      {/*{currentPlan && <UsageDisplay plan={currentPlan} usage={usage} status={company.subscriptionStatus || "none"} />}*/}

      <UsageDisplay
        plan={currentPlan}
        usage={usage}
        status={company.subscriptionStatus || "none"}
        walletBalance={company.walletBalance}
      />

      <div>
        <h2 className="font-display text-2xl mb-2" style={{ color: "var(--text)" }}>
          {currentPlan ? "Change plan" : "Choose a plan"}
        </h2>
        <p className="mb-6" style={{ color: "var(--text-muted)" }}>
          {currentPlan ? "Upgrade or downgrade your subscription plan" : "Get started with included credits and discounted overage rates"}
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isUpgrade = currentPlan && plan.monthlyPriceKes > currentPlan.monthlyPriceKes;
            const isDowngrade = currentPlan && plan.monthlyPriceKes < currentPlan.monthlyPriceKes;
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlan={currentPlan}
                onSelect={() => handleSelectPlan(plan.id)}
                isLoading={loadingPlanId === plan.id}
                disabled={loadingPlanId !== null && loadingPlanId !== plan.id}
                changeDirection={isUpgrade ? "upgrade" : isDowngrade ? "downgrade" : null}
              />
            );
          })}
        </div>

        {currentPlan && (
          <div className="mt-6 p-6 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>Pay-as-you-go option</h3>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              You can cancel your subscription and return to pay-as-you-go billing using your wallet balance.
            </p>
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={cancelLoading || loadingPlanId !== null}
              className="px-4 py-2.5 rounded-lg font-medium text-sm border transition disabled:opacity-50"
              style={{ borderColor: "rgba(239,68,68,0.4)", color: "#fca5a5" }}
            >
              {cancelLoading ? "Canceling…" : "Cancel subscription"}
            </button>
          </div>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {showCancelConfirm && currentPlan && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="w-full max-w-sm rounded-2xl border p-6"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "rgba(239,68,68,0.12)" }}
            >
              <i className="bi bi-exclamation-triangle-fill" style={{ color: "#f87171", fontSize: 18 }} />
            </div>
            <h3 className="font-display text-lg mb-2" style={{ color: "var(--text)" }}>
              Cancel {currentPlan.name}?
            </h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              You&apos;ll lose your included monthly credits and move to pay-as-you-go billing from your
              wallet balance immediately. This can&apos;t be undone — you&apos;d need to resubscribe to get plan pricing back.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border transition hover:border-white/20"
                style={{ borderColor: "var(--border-strong)", color: "var(--text)" }}
              >
                Keep plan
              </button>
              <button
                onClick={handleCancelPlan}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition hover:brightness-110"
                style={{ background: "#dc2626", color: "white" }}
              >
                Cancel subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}