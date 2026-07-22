"use client";

import { FallbackRule } from "@prisma/client";
import { useState } from "react";

interface FallbackRulesListProps {
  rules: FallbackRule[];
}

const channelMeta: Record<string, { icon: string; color: string }> = {
  sms: { icon: "bi-chat-dots-fill", color: "var(--sms)" },
  email: { icon: "bi-envelope-fill", color: "var(--email)" },
  whatsapp: { icon: "bi-whatsapp", color: "var(--whatsapp)" },
};

const conditionLabels: Record<string, string> = {
  undelivered: "Not delivered",
  unread: "Not read/opened",
  bounced: "Bounced/Failed",
};

export default function FallbackRulesList({ rules }: FallbackRulesListProps) {
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  const handleToggle = async (ruleId: string, currentStatus: boolean) => {
    setToggleLoading(ruleId);
    try {
      const res = await fetch(`/api/automation/rules/${ruleId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentStatus }),
      });
      if (res.ok) window.location.reload();
    } catch (error) {
      console.error("Toggle error:", error);
    } finally {
      setToggleLoading(null);
    }
  };

  if (rules.length === 0) {
    return (
      <div className="rounded-2xl border p-16 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(139,92,246,0.12)" }}>
          <i className="bi bi-arrow-repeat" style={{ color: "var(--primary)", fontSize: 22 }} />
        </div>
        <h3 className="font-display text-xl mb-2" style={{ color: "var(--text)" }}>No fallback rules yet</h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Create your first fallback rule to start automating cross-channel delivery.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map((rule) => {
        const primary = channelMeta[rule.primaryChannel] ?? { icon: "bi-question-circle", color: "var(--text-faint)" };
        const fallback = channelMeta[rule.fallbackChannel] ?? { icon: "bi-question-circle", color: "var(--text-faint)" };
        return (
          <div
            key={rule.id}
            className="rounded-2xl border p-6"
            style={{ background: "var(--surface)", borderColor: rule.enabled ? "rgba(52,211,153,0.35)" : "var(--border)" }}
          >
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-semibold text-lg" style={{ color: "var(--text)" }}>{rule.name}</h3>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={
                      rule.enabled
                        ? { background: "rgba(52,211,153,0.12)", color: "var(--whatsapp)" }
                        : { background: "var(--surface-2)", color: "var(--text-faint)" }
                    }
                  >
                    {rule.enabled ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                  Created {new Date(rule.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleToggle(rule.id, rule.enabled)}
                disabled={toggleLoading === rule.id}
                className="px-4 py-2 rounded-full text-sm font-medium transition disabled:opacity-50"
                style={
                  rule.enabled
                    ? { background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }
                    : { background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }
                }
              >
                {toggleLoading === rule.id ? "…" : rule.enabled ? "Disable" : "Enable"}
              </button>
            </div>

            <div className="rounded-xl border p-5" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${primary.color}1a`, border: `1px solid ${primary.color}33` }}>
                    <i className={`bi ${primary.icon}`} style={{ color: primary.color, fontSize: 18 }} />
                  </div>
                  <div className="font-medium text-sm" style={{ color: "var(--text)" }}>{rule.primaryChannel.toUpperCase()}</div>
                  <div className="text-xs" style={{ color: "var(--text-faint)" }}>Primary</div>
                </div>

                <div className="flex-1 mx-6 text-center">
                  <div className="flex items-center">
                    <div className="flex-1 h-px" style={{ background: "var(--border-strong)" }} />
                    <div className="mx-3">
                      <div
                        className="text-xs font-medium px-3 py-1.5 rounded-full border whitespace-nowrap"
                        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
                      >
                        {conditionLabels[rule.triggerCondition] ?? rule.triggerCondition}
                      </div>
                      <div className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>after {rule.delayMinutes} min</div>
                    </div>
                    <div className="flex-1 h-px" style={{ background: "var(--border-strong)" }} />
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${fallback.color}1a`, border: `1px solid ${fallback.color}33` }}>
                    <i className={`bi ${fallback.icon}`} style={{ color: fallback.color, fontSize: 18 }} />
                  </div>
                  <div className="font-medium text-sm" style={{ color: "var(--text)" }}>{rule.fallbackChannel.toUpperCase()}</div>
                  <div className="text-xs" style={{ color: "var(--text-faint)" }}>Fallback</div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--text)" }}>How it works:</strong> when a campaign uses this rule, if a message on {rule.primaryChannel.toUpperCase()} is{" "}
              {(conditionLabels[rule.triggerCondition] ?? rule.triggerCondition).toLowerCase()} after {rule.delayMinutes} minutes, it&apos;s automatically resent via {rule.fallbackChannel.toUpperCase()}.
            </p>
          </div>
        );
      })}
    </div>
  );
}