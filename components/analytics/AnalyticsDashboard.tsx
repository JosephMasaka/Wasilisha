"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface SerializedMessage {
  id: string;
  status: string;
  costKes: string;
}

interface SerializedCampaign {
  id: string;
  name: string;
  channel: string;
  createdAt: Date | string;
  messages: SerializedMessage[];
}

interface DailyStat {
  date: string;
  channel: string;
  total: number;
  delivered: number;
  failed: number;
  cost: number;
}

interface AnalyticsDashboardProps {
  campaigns: SerializedCampaign[];
  dailyStats: DailyStat[];
}

const channelMeta: Record<string, { color: string; icon: string; label: string; hex: string }> = {
  sms: { color: "var(--sms)", icon: "bi-chat-dots-fill", label: "SMS", hex: "#fbbf24" },
  email: { color: "var(--email)", icon: "bi-envelope-fill", label: "Email", hex: "#60a5fa" },
  whatsapp: { color: "var(--whatsapp)", icon: "bi-whatsapp", label: "WhatsApp", hex: "#34d399" },
};

function rateColor(rate: number) {
  return rate >= 95 ? "var(--whatsapp)" : rate >= 80 ? "var(--sms)" : "#f87171";
}

export default function AnalyticsDashboard({ campaigns, dailyStats }: AnalyticsDashboardProps) {
  const [selectedChannel, setSelectedChannel] = useState<"all" | "sms" | "email" | "whatsapp">("all");

  const totalMessages = campaigns.reduce((sum, c) => sum + c.messages.length, 0);
  const deliveredMessages = campaigns.reduce((sum, c) => sum + c.messages.filter((m) => m.status === "delivered").length, 0);
  const failedMessages = campaigns.reduce((sum, c) => sum + c.messages.filter((m) => m.status === "failed").length, 0);
  const totalCost = campaigns.reduce((sum, c) => sum + c.messages.reduce((s, m) => s + Number(m.costKes), 0), 0);

  const deliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;
  const failureRate = totalMessages > 0 ? (failedMessages / totalMessages) * 100 : 0;
  const avgCostPerMessage = totalMessages > 0 ? totalCost / totalMessages : 0;

  const filteredCampaigns = selectedChannel === "all" ? campaigns : campaigns.filter((c) => c.channel === selectedChannel);

  const channelStats = useMemo(() => {
    const empty = { total: 0, delivered: 0, failed: 0, cost: 0 };
    const acc: Record<string, typeof empty> = { sms: { ...empty }, email: { ...empty }, whatsapp: { ...empty } };
    for (const c of campaigns) {
      if (!acc[c.channel]) continue;
      acc[c.channel].total += c.messages.length;
      acc[c.channel].delivered += c.messages.filter((m) => m.status === "delivered").length;
      acc[c.channel].failed += c.messages.filter((m) => m.status === "failed").length;
      acc[c.channel].cost += c.messages.reduce((s, m) => s + Number(m.costKes), 0);
    }
    return acc;
  }, [campaigns]);

  // dailyStats arrives as one row per (date, channel) — reshape into one row
  // per date with a column per channel, which is what recharts wants.
  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, number>>();
    for (const stat of dailyStats) {
      const key = new Date(stat.date).toISOString().slice(0, 10);
      if (!byDate.has(key)) byDate.set(key, { sms: 0, email: 0, whatsapp: 0 });
      byDate.get(key)![stat.channel] = (byDate.get(key)![stat.channel] ?? 0) + stat.total;
    }
    return Array.from(byDate.entries())
      .map(([date, channels]) => ({ date, ...channels }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyStats]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl" style={{ color: "var(--text)" }}>Analytics</h1>
        <p className="mt-1" style={{ color: "var(--text-muted)" }}>Campaign performance and delivery insights — last 30 days</p>
      </div>

      {/* Overall metrics */}
      <div className="grid md:grid-cols-4 gap-5">
        <div className="rounded-2xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="h-1 w-8 rounded-full mb-4" style={{ background: "var(--primary)", boxShadow: "0 0 10px 1px var(--primary)" }} />
          <div className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Total messages</div>
          <div className="text-3xl font-semibold" style={{ color: "var(--text)" }}>{totalMessages.toLocaleString()}</div>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>Across all campaigns</p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="h-1 w-8 rounded-full mb-4" style={{ background: "var(--whatsapp)", boxShadow: "0 0 10px 1px var(--whatsapp)" }} />
          <div className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Delivery rate</div>
          <div className="text-3xl font-semibold" style={{ color: "var(--whatsapp)" }}>{deliveryRate.toFixed(1)}%</div>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{deliveredMessages.toLocaleString()} delivered</p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="h-1 w-8 rounded-full mb-4" style={{ background: "#f87171", boxShadow: "0 0 10px 1px #f87171" }} />
          <div className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Failure rate</div>
          <div className="text-3xl font-semibold" style={{ color: "#f87171" }}>{failureRate.toFixed(1)}%</div>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{failedMessages.toLocaleString()} failed</p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="h-1 w-8 rounded-full mb-4" style={{ background: "var(--email)", boxShadow: "0 0 10px 1px var(--email)" }} />
          <div className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Avg cost / message</div>
          <div className="text-3xl font-semibold" style={{ color: "var(--text)" }}>KES {avgCostPerMessage.toFixed(2)}</div>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>Total: KES {totalCost.toFixed(2)}</p>
        </div>
      </div>

      {/* Trend chart */}
      <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h2 className="text-sm font-medium mb-5" style={{ color: "var(--text-muted)" }}>Messages sent per day</h2>
        {chartData.length === 0 ? (
          <p className="text-sm py-16 text-center" style={{ color: "var(--text-faint)" }}>Not enough data yet.</p>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6d6790", fontSize: 11 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                />
                <YAxis tick={{ fill: "#6d6790", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#171325", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#f5f3fa" }}
                  labelFormatter={(d) => new Date(d).toLocaleDateString()}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#a29cc4" }} />
                <Line type="monotone" dataKey="sms" name="SMS" stroke={channelMeta.sms.hex} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="email" name="Email" stroke={channelMeta.email.hex} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="whatsapp" name="WhatsApp" stroke={channelMeta.whatsapp.hex} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Channel breakdown */}
      <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h2 className="text-sm font-medium mb-5" style={{ color: "var(--text-muted)" }}>Performance by channel</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {(["sms", "email", "whatsapp"] as const).map((channel) => {
            const stats = channelStats[channel];
            const meta = channelMeta[channel];
            const rate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0;

            return (
              <div key={channel} className="rounded-xl border p-5" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}1a` }}>
                    <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: 14 }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{meta.label}</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Sent</span><span style={{ color: "var(--text)" }}>{stats.total.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Delivered</span><span style={{ color: "var(--whatsapp)" }}>{stats.delivered.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span style={{ color: "var(--text-faint)" }}>Failed</span><span style={{ color: stats.failed > 0 ? "#f87171" : "var(--text-muted)" }}>{stats.failed.toLocaleString()}</span></div>
                </div>

                {stats.total > 0 && (
                  <div className="pt-3 mt-3 border-t" style={{ borderColor: "var(--border)" }}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs" style={{ color: "var(--text-faint)" }}>Success rate</span>
                      <span className="text-sm font-semibold" style={{ color: rateColor(rate) }}>{rate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ background: "var(--surface)" }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${rate}%`, background: rateColor(rate) }} />
                    </div>
                  </div>
                )}

                <div className="pt-3 mt-3 border-t flex justify-between text-sm font-medium" style={{ borderColor: "var(--border)" }}>
                  <span style={{ color: "var(--text)" }}>Total cost</span>
                  <span style={{ color: "var(--text)" }}>KES {stats.cost.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaign list */}
      <div className="rounded-2xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Campaign performance</h2>
          <div className="flex gap-2">
            {(["all", "sms", "email", "whatsapp"] as const).map((channel) => {
              const active = selectedChannel === channel;
              const accent = channel === "all" ? "var(--primary)" : channelMeta[channel].color;
              return (
                <button
                  key={channel}
                  onClick={() => setSelectedChannel(channel)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium border transition"
                  style={{
                    background: active ? "var(--surface-2)" : "transparent",
                    borderColor: active ? accent : "var(--border)",
                    color: active ? accent : "var(--text-muted)",
                  }}
                >
                  {channel === "all" ? "All" : channelMeta[channel].label}
                </button>
              );
            })}
          </div>
        </div>

        {filteredCampaigns.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: "var(--text-faint)" }}>No campaigns in the selected period</p>
        ) : (
          <div className="space-y-3">
            {filteredCampaigns.map((campaign) => {
              const meta = channelMeta[campaign.channel] ?? channelMeta.sms;
              const total = campaign.messages.length;
              const delivered = campaign.messages.filter((m) => m.status === "delivered").length;
              const failed = campaign.messages.filter((m) => m.status === "failed").length;
              const cost = campaign.messages.reduce((sum, m) => sum + Number(m.costKes), 0);
              const rate = total > 0 ? (delivered / total) * 100 : 0;

              return (
                <Link
                  key={campaign.id}
                  href={`/dashboard/campaigns/${campaign.id}`}
                  className="block rounded-xl border p-4 transition hover:border-white/20"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${meta.color}1a` }}>
                        <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: 12 }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium" style={{ color: "var(--text)" }}>{campaign.name}</h3>
                        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {total > 0 && (
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: "var(--surface)", color: rateColor(rate) }}
                      >
                        {rate.toFixed(1)}% success
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-xs" style={{ color: "var(--text-faint)" }}>Total</span>
                      <div className="font-medium" style={{ color: "var(--text)" }}>{total}</div>
                    </div>
                    <div>
                      <span className="text-xs" style={{ color: "var(--text-faint)" }}>Delivered</span>
                      <div className="font-medium" style={{ color: "var(--whatsapp)" }}>{delivered}</div>
                    </div>
                    <div>
                      <span className="text-xs" style={{ color: "var(--text-faint)" }}>Failed</span>
                      <div className="font-medium" style={{ color: failed > 0 ? "#f87171" : "var(--text-muted)" }}>{failed}</div>
                    </div>
                    <div>
                      <span className="text-xs" style={{ color: "var(--text-faint)" }}>Cost</span>
                      <div className="font-medium" style={{ color: "var(--text)" }}>KES {cost.toFixed(2)}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}