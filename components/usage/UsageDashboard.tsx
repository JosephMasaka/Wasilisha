"use client";

import Link from "next/link";

interface SerializedPlan {
  id: string;
  name: string;
  monthlyPriceKes: number;
  includedSmsCredits: number;
  includedEmailCredits: number;
  includedWhatsappCredits: number;
  overageRateSms: string;
  overageRateEmail: string;
  overageRateWhatsapp: string;
}

interface SerializedCompany {
  name: string;
  walletBalance: string;
  subscriptionPlan: SerializedPlan | null;
}

interface ChannelUsage {
  total: number;
  delivered: number;
  failed: number;
  cost: number;
}

interface SerializedMessage {
  id: string;
  status: string;
  costKes: string;
}

interface SerializedCampaign {
  id: string;
  name: string;
  channel: string;
  status: string;
  messages: SerializedMessage[];
}

interface SerializedTransaction {
  id: string;
  type: string;
  amountKes: string;
  channel: string | null;
  createdAt: Date | string;
}

interface UsageDashboardProps {
  company: SerializedCompany;
  usage: { sms: ChannelUsage; email: ChannelUsage; whatsapp: ChannelUsage };
  campaigns: SerializedCampaign[];
  transactions: SerializedTransaction[];
}

const channelMeta: Record<string, { color: string; icon: string; label: string }> = {
  sms: { color: "var(--sms)", icon: "bi-chat-dots-fill", label: "SMS" },
  email: { color: "var(--email)", icon: "bi-envelope-fill", label: "Email" },
  whatsapp: { color: "var(--whatsapp)", icon: "bi-whatsapp", label: "WhatsApp" },
};

const campaignStatusMeta: Record<string, { color: string; bg: string }> = {
  completed: { color: "var(--whatsapp)", bg: "rgba(52,211,153,0.12)" },
  sending: { color: "var(--email)", bg: "rgba(96,165,250,0.12)" },
  scheduled: { color: "var(--sms)", bg: "rgba(251,191,36,0.12)" },
  failed: { color: "#f87171", bg: "rgba(239,68,68,0.12)" },
  draft: { color: "var(--text-faint)", bg: "var(--surface-2)" },
};

export default function UsageDashboard({ company, usage, campaigns, transactions }: UsageDashboardProps) {
  const plan = company.subscriptionPlan;
  const balance = Number(company.walletBalance);

  const totalCost = usage.sms.cost + usage.email.cost + usage.whatsapp.cost;
  const totalMessages = usage.sms.total + usage.email.total + usage.whatsapp.total;

  const balanceStatus = balance < 100 ? "low" : balance < 500 ? "medium" : "good";

  const channels = [
    {
      key: "sms",
      name: "SMS",
      data: usage.sms,
      included: plan?.includedSmsCredits || 0,
      overage: plan?.overageRateSms || "0.80",
    },
    {
      key: "email",
      name: "Email",
      data: usage.email,
      included: plan?.includedEmailCredits || 0,
      overage: plan?.overageRateEmail || "0.10",
    },
    {
      key: "whatsapp",
      name: "WhatsApp",
      data: usage.whatsapp,
      included: plan?.includedWhatsappCredits || 0,
      overage: plan?.overageRateWhatsapp || "0.50",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="font-display text-3xl" style={{ color: "var(--text)" }}>Usage dashboard</h1>
          <p className="mt-1" style={{ color: "var(--text-muted)" }}>Track your messaging usage and costs</p>
        </div>
        <Link
          href="/dashboard/subscription"
          className="px-5 py-2.5 rounded-full text-sm font-medium border transition hover:border-white/20"
          style={{ borderColor: "var(--border-strong)", color: "var(--text)" }}
        >
          Manage subscription
        </Link>
      </div>

      {/* Low balance alert */}
      {balanceStatus === "low" && (
        <div
          className="flex items-start gap-3 rounded-xl p-4 border"
          style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)" }}
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.15)" }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ color: "#f87171", fontSize: 15 }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1" style={{ color: "#fca5a5" }}>Low balance warning</h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Your wallet balance is low (KES {balance.toFixed(2)}). Top up to continue sending messages.
            </p>
            <Link href="/dashboard" className="inline-block mt-2 text-sm font-medium hover:underline" style={{ color: "#fca5a5" }}>
              Top up wallet →
            </Link>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid md:grid-cols-4 gap-5">
        <div className="rounded-2xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="h-1 w-8 rounded-full mb-4" style={{ background: "var(--primary)", boxShadow: "0 0 10px 1px var(--primary)" }} />
          <div className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Total messages</div>
          <div className="text-3xl font-semibold" style={{ color: "var(--text)" }}>{totalMessages.toLocaleString()}</div>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>This month</p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="h-1 w-8 rounded-full mb-4" style={{ background: "var(--warm)", boxShadow: "0 0 10px 1px var(--warm)" }} />
          <div className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Total cost</div>
          <div className="text-3xl font-semibold" style={{ color: "var(--text)" }}>KES {totalCost.toFixed(2)}</div>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>This month</p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div
            className="h-1 w-8 rounded-full mb-4"
            style={{
              background: balanceStatus === "low" ? "#f87171" : "var(--email)",
              boxShadow: `0 0 10px 1px ${balanceStatus === "low" ? "#f87171" : "var(--email)"}`,
            }}
          />
          <div className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Wallet balance</div>
          <div className="text-3xl font-semibold" style={{ color: "var(--text)" }}>KES {balance.toFixed(2)}</div>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>Available</p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="h-1 w-8 rounded-full mb-4" style={{ background: "var(--whatsapp)", boxShadow: "0 0 10px 1px var(--whatsapp)" }} />
          <div className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Active plan</div>
          <div className="text-xl font-semibold" style={{ color: "var(--text)" }}>{plan?.name || "Pay-as-you-go"}</div>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
            {plan ? `KES ${plan.monthlyPriceKes.toLocaleString()}/mo` : "No subscription"}
          </p>
        </div>
      </div>

      {/* Channel usage */}
      <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h2 className="text-sm font-medium mb-5" style={{ color: "var(--text-muted)" }}>Usage by channel</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {channels.map((channel) => {
            const meta = channelMeta[channel.key];
            const percentage = plan && channel.included > 0 ? Math.min((channel.data.total / channel.included) * 100, 100) : 0;
            const isOverage = !!plan && channel.included > 0 && channel.data.total > channel.included;
            const remaining = plan ? Math.max(channel.included - channel.data.total, 0) : 0;

            return (
              <div key={channel.name} className="rounded-xl border p-5" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}1a` }}>
                    <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: 14 }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{channel.name}</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Sent</span><span style={{ color: "var(--text)" }}>{channel.data.total.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Delivered</span><span style={{ color: "var(--whatsapp)" }}>{channel.data.delivered.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Failed</span><span style={{ color: channel.data.failed > 0 ? "#f87171" : "var(--text-muted)" }}>{channel.data.failed.toLocaleString()}</span></div>
                  <div className="flex justify-between pt-2 mt-1 border-t" style={{ borderColor: "var(--border)" }}>
                    <span className="font-medium" style={{ color: "var(--text)" }}>Cost</span>
                    <span className="font-medium" style={{ color: "var(--text)" }}>KES {channel.data.cost.toFixed(2)}</span>
                  </div>
                </div>

                {plan && (
                  <div className="pt-4 mt-4 border-t" style={{ borderColor: "var(--border)" }}>
                    <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-faint)" }}>
                      <span>Credits</span>
                      <span>{channel.data.total.toLocaleString()} / {channel.included.toLocaleString()}</span>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ background: "var(--surface)" }}>
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          background: isOverage ? "#f87171" : percentage > 80 ? "var(--sms)" : meta.color,
                        }}
                      />
                    </div>
                    {isOverage ? (
                      <p className="text-xs mt-1.5" style={{ color: "#fca5a5" }}>
                        Using overage rate: KES {channel.overage}
                      </p>
                    ) : (
                      <p className="text-xs mt-1.5" style={{ color: "var(--text-faint)" }}>
                        {remaining.toLocaleString()} credits remaining
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent campaigns */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Recent campaigns</h2>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-sm px-6 py-10 text-center" style={{ color: "var(--text-faint)" }}>No campaigns this month</p>
        ) : (
          <div className="px-6 py-2">
            {campaigns.slice(0, 5).map((campaign, i) => {
              const meta = channelMeta[campaign.channel] ?? channelMeta.sms;
              const statusMeta = campaignStatusMeta[campaign.status] ?? campaignStatusMeta.draft;
              return (
                <Link
                  key={campaign.id}
                  href={`/dashboard/campaigns/${campaign.id}`}
                  className="flex items-center justify-between py-4"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${meta.color}1a` }}>
                      <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: 13 }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium" style={{ color: "var(--text)" }}>{campaign.name}</h3>
                      <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                        {meta.label} · {campaign.messages.length} messages
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: statusMeta.bg, color: statusMeta.color }}
                  >
                    {campaign.status}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Recent transactions</h2>
        </div>
        {transactions.length === 0 ? (
          <p className="text-sm px-6 py-10 text-center" style={{ color: "var(--text-faint)" }}>No transactions yet</p>
        ) : (
          <div className="px-6 py-2">
            {transactions.map((tx, i) => {
              const isTopup = tx.type === "topup";
              const channelLabel = tx.channel ? channelMeta[tx.channel]?.label ?? tx.channel : null;
              return (
                <div
                  key={tx.id}
                  className="flex justify-between items-center py-4"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
                >
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {isTopup ? "Wallet top-up" : `${channelLabel} message`}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                      {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <span className="font-semibold text-sm" style={{ color: isTopup ? "var(--whatsapp)" : "var(--text)" }}>
                    {isTopup ? "+" : "-"}KES {Number(tx.amountKes).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}