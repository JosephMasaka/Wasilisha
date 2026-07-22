"use client";

import { Campaign, Message } from "@prisma/client";
import { useState } from "react";
import Link from "next/link";

interface AnalyticsDashboardProps {
  campaigns: (Campaign & { messages: Message[] })[];
  dailyStats: Array<{
    date: Date;
    channel: string;
    total: number;
    delivered: number;
    failed: number;
    cost: number;
  }>;
}

export default function AnalyticsDashboard({
  campaigns,
  dailyStats,
}: AnalyticsDashboardProps) {
  const [selectedChannel, setSelectedChannel] = useState<
    "all" | "sms" | "email" | "whatsapp"
  >("all");

  // Calculate overall metrics
  const totalMessages = campaigns.reduce(
    (sum, c) => sum + c.messages.length,
    0
  );
  const deliveredMessages = campaigns.reduce(
    (sum, c) => sum + c.messages.filter((m) => m.status === "delivered").length,
    0
  );
  const failedMessages = campaigns.reduce(
    (sum, c) => sum + c.messages.filter((m) => m.status === "failed").length,
    0
  );
  const totalCost = campaigns.reduce(
    (sum, c) =>
      sum +
      c.messages.reduce((s, m) => s + parseFloat(m.costKes.toString()), 0),
    0
  );

  const deliveryRate =
    totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;
  const failureRate =
    totalMessages > 0 ? (failedMessages / totalMessages) * 100 : 0;
  const avgCostPerMessage = totalMessages > 0 ? totalCost / totalMessages : 0;

  // Filter campaigns by channel
  const filteredCampaigns =
    selectedChannel === "all"
      ? campaigns
      : campaigns.filter((c) => c.channel === selectedChannel);

  // Channel breakdown
  const channelStats = {
    sms: campaigns
      .filter((c) => c.channel === "sms")
      .reduce(
        (acc, c) => {
          acc.total += c.messages.length;
          acc.delivered += c.messages.filter(
            (m) => m.status === "delivered"
          ).length;
          acc.failed += c.messages.filter((m) => m.status === "failed").length;
          acc.cost += c.messages.reduce(
            (s, m) => s + parseFloat(m.costKes.toString()),
            0
          );
          return acc;
        },
        { total: 0, delivered: 0, failed: 0, cost: 0 }
      ),
    email: campaigns
      .filter((c) => c.channel === "email")
      .reduce(
        (acc, c) => {
          acc.total += c.messages.length;
          acc.delivered += c.messages.filter(
            (m) => m.status === "delivered"
          ).length;
          acc.failed += c.messages.filter((m) => m.status === "failed").length;
          acc.cost += c.messages.reduce(
            (s, m) => s + parseFloat(m.costKes.toString()),
            0
          );
          return acc;
        },
        { total: 0, delivered: 0, failed: 0, cost: 0 }
      ),
    whatsapp: campaigns
      .filter((c) => c.channel === "whatsapp")
      .reduce(
        (acc, c) => {
          acc.total += c.messages.length;
          acc.delivered += c.messages.filter(
            (m) => m.status === "delivered"
          ).length;
          acc.failed += c.messages.filter((m) => m.status === "failed").length;
          acc.cost += c.messages.reduce(
            (s, m) => s + parseFloat(m.costKes.toString()),
            0
          );
          return acc;
        },
        { total: 0, delivered: 0, failed: 0, cost: 0 }
      ),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          Campaign performance and delivery insights (Last 30 days)
        </p>
      </div>

      {/* Overall Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Total Messages
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {totalMessages.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 mt-1">Across all campaigns</p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200">
          <div className="text-sm font-medium text-green-700 mb-1">
            Delivery Rate
          </div>
          <div className="text-3xl font-bold text-green-600">
            {deliveryRate.toFixed(1)}%
          </div>
          <p className="text-xs text-green-600 mt-1">
            {deliveredMessages.toLocaleString()} delivered
          </p>
        </div>

        <div className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-200">
          <div className="text-sm font-medium text-red-700 mb-1">
            Failure Rate
          </div>
          <div className="text-3xl font-bold text-red-600">
            {failureRate.toFixed(1)}%
          </div>
          <p className="text-xs text-red-600 mt-1">
            {failedMessages.toLocaleString()} failed
          </p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200">
          <div className="text-sm font-medium text-blue-700 mb-1">
            Avg Cost/Message
          </div>
          <div className="text-3xl font-bold text-blue-600">
            KES {avgCostPerMessage.toFixed(2)}
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Total: KES {totalCost.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Channel Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Performance by Channel
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(channelStats).map(([channel, stats]) => {
            const rate =
              stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0;
            const channelIcons = {
              sms: "📱",
              email: "✉️",
              whatsapp: "💬",
            };

            return (
              <div
                key={channel}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-2xl">
                    {channelIcons[channel as keyof typeof channelIcons]}
                  </span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {channel}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sent</span>
                    <span className="font-medium">
                      {stats.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivered</span>
                    <span className="font-medium text-green-600">
                      {stats.delivered.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Failed</span>
                    <span className="font-medium text-red-600">
                      {stats.failed.toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">
                        Success Rate
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          rate >= 95
                            ? "bg-green-500"
                            : rate >= 80
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-gray-900">Total Cost</span>
                      <span className="text-gray-900">
                        KES {stats.cost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaign List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Campaign Performance
          </h2>
          <div className="flex space-x-2">
            {["all", "sms", "email", "whatsapp"].map((channel) => (
              <button
                key={channel}
                onClick={() =>
                  setSelectedChannel(channel as typeof selectedChannel)
                }
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  selectedChannel === channel
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {channel === "all" ? "All" : channel.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {filteredCampaigns.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No campaigns in the selected period
          </p>
        ) : (
          <div className="space-y-3">
            {filteredCampaigns.map((campaign) => {
              const total = campaign.messages.length;
              const delivered = campaign.messages.filter(
                (m) => m.status === "delivered"
              ).length;
              const failed = campaign.messages.filter(
                (m) => m.status === "failed"
              ).length;
              const cost = campaign.messages.reduce(
                (sum, m) => sum + parseFloat(m.costKes.toString()),
                0
              );
              const rate = total > 0 ? (delivered / total) * 100 : 0;

              return (
                <Link
                  key={campaign.id}
                  href={`/dashboard/campaigns/${campaign.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {campaign.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {campaign.channel.toUpperCase()} •{" "}
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        rate >= 95
                          ? "bg-green-100 text-green-800"
                          : rate >= 80
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {rate.toFixed(1)}% success
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total</span>
                      <div className="font-medium">{total}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Delivered</span>
                      <div className="font-medium text-green-600">
                        {delivered}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Failed</span>
                      <div className="font-medium text-red-600">{failed}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Cost</span>
                      <div className="font-medium">KES {cost.toFixed(2)}</div>
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
