"use client";

import { FallbackRule } from "@prisma/client";
import { useState } from "react";

interface FallbackRulesListProps {
  rules: FallbackRule[];
}

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

      if (res.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Toggle error:", error);
    } finally {
      setToggleLoading(null);
    }
  };

  const channelIcons = {
    sms: "📱",
    email: "✉️",
    whatsapp: "💬",
  };

  const conditionLabels = {
    undelivered: "Not delivered",
    unread: "Not read/opened",
    bounced: "Bounced/Failed",
  };

  if (rules.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 text-5xl mb-4">🔄</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Fallback Rules Yet
        </h3>
        <p className="text-gray-600">
          Create your first fallback rule to start automating cross-channel
          delivery
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map((rule) => (
        <div
          key={rule.id}
          className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
            rule.enabled ? "border-green-200" : "border-gray-200"
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {rule.name}
                </h3>
                {rule.enabled && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    ACTIVE
                  </span>
                )}
                {!rule.enabled && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    INACTIVE
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Created {new Date(rule.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => handleToggle(rule.id, rule.enabled)}
              disabled={toggleLoading === rule.id}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                rule.enabled
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-green-600 text-white hover:bg-green-700"
              } disabled:opacity-50`}
            >
              {toggleLoading === rule.id
                ? "..."
                : rule.enabled
                ? "Disable"
                : "Enable"}
            </button>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              {/* Primary Channel */}
              <div className="text-center">
                <div className="text-3xl mb-2">
                  {
                    channelIcons[
                      rule.primaryChannel as keyof typeof channelIcons
                    ]
                  }
                </div>
                <div className="font-semibold text-gray-900">
                  {rule.primaryChannel.toUpperCase()}
                </div>
                <div className="text-xs text-gray-600">Primary</div>
              </div>

              {/* Arrow & Condition */}
              <div className="flex-1 mx-6">
                <div className="flex items-center">
                  <div className="flex-1 border-t-2 border-dashed border-gray-400"></div>
                  <div className="mx-4 text-center">
                    <div className="text-2xl mb-1">⏱️</div>
                    <div className="text-xs font-medium text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-300">
                      {
                        conditionLabels[
                          rule.triggerCondition as keyof typeof conditionLabels
                        ]
                      }
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      After {rule.delayMinutes} min
                    </div>
                  </div>
                  <div className="flex-1 border-t-2 border-dashed border-gray-400"></div>
                </div>
              </div>

              {/* Fallback Channel */}
              <div className="text-center">
                <div className="text-3xl mb-2">
                  {
                    channelIcons[
                      rule.fallbackChannel as keyof typeof channelIcons
                    ]
                  }
                </div>
                <div className="font-semibold text-gray-900">
                  {rule.fallbackChannel.toUpperCase()}
                </div>
                <div className="text-xs text-gray-600">Fallback</div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <strong>How it works:</strong> When you send a campaign with this
            rule, if a message on {rule.primaryChannel.toUpperCase()} is{" "}
            {
              conditionLabels[
                rule.triggerCondition as keyof typeof conditionLabels
              ].toLowerCase()
            }{" "}
            after {rule.delayMinutes} minutes, it will automatically be resent
            via {rule.fallbackChannel.toUpperCase()}.
          </div>
        </div>
      ))}
    </div>
  );
}
