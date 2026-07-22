"use client";

import { Company, SubscriptionPlan } from "@prisma/client";
import { useState } from "react";
import PlanCard from "./PlanCard";
import UsageDisplay from "./UsageDisplay";

interface SubscriptionManagerProps {
  company: Company & { subscriptionPlan: SubscriptionPlan | null };
  plans: SubscriptionPlan[];
  usage: { sms: number; email: number; whatsapp: number };
}

export default function SubscriptionManager({ company, plans, usage }: SubscriptionManagerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelectPlan = async (planId: string) => {
    setError("");
    setLoading(true);
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
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPlan = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel subscription");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = company.subscriptionPlan;

  return (
    <div className="space-y-8">
      {error && (
        <div className="text-sm p-4 rounded-lg border" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {currentPlan && <UsageDisplay plan={currentPlan} usage={usage} status={company.subscriptionStatus || "none"} />}

      <div>
        <h2 className="font-display text-2xl mb-2" style={{ color: "var(--text)" }}>
          {currentPlan ? "Change plan" : "Choose a plan"}
        </h2>
        <p className="mb-6" style={{ color: "var(--text-muted)" }}>
          {currentPlan ? "Upgrade or downgrade your subscription plan" : "Get started with included credits and discounted overage rates"}
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} currentPlan={currentPlan} onSelect={() => handleSelectPlan(plan.id)} loading={loading} />
          ))}
        </div>

        {currentPlan && (
          <div className="mt-6 p-6 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>Pay-as-you-go option</h3>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              You can cancel your subscription and return to pay-as-you-go billing using your wallet balance.
            </p>
            <button
              onClick={handleCancelPlan}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg font-medium text-sm border transition disabled:opacity-50"
              style={{ borderColor: "rgba(239,68,68,0.4)", color: "#fca5a5" }}
            >
              {loading ? "Canceling…" : "Cancel subscription"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}