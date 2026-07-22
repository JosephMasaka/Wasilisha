"use client";

import { Company, SubscriptionPlan, Campaign, Message, WalletTransaction } from "@prisma/client";
import Link from "next/link";

interface UsageDashboardProps {
  company: Company & { subscriptionPlan: SubscriptionPlan | null };
  usage: {
    sms: { total: number; delivered: number; failed: number; cost: number };
    email: { total: number; delivered: number; failed: number; cost: number };
    whatsapp: { total: number; delivered: number; failed: number; cost: number };
  };
  campaigns: (Campaign & { messages: Message[] })[];
  transactions: WalletTransaction[];
}

export default function UsageDashboard({
  company,
  usage,
  campaigns,
  transactions,
}: UsageDashboardProps) {
  const plan = company.subscriptionPlan;
  const totalCost =
    usage.sms.cost + usage.email.cost + usage.whatsapp.cost;
  const totalMessages =
    usage.sms.total + usage.email.total + usage.whatsapp.total;

  const balanceStatus =
    parseFloat(company.walletBalance.toString()) < 100
      ? "low"
      : parseFloat(company.walletBalance.toString()) < 500
      ? "medium"
      : "good";

  const channels = [
    {
      name: "SMS",
      icon: "📱",
      data: usage.sms,
      included: plan?.includedSmsCredits || 0,
      overage: plan?.overageRateSms.toString() || "0.80",
    },
    {
      name: "Email",
      icon: "✉️",
      data: usage.email,
      included: plan?.includedEmailCredits || 0,
      overage: plan?.overageRateEmail.toString() || "0.10",
    },
    {
      name: "WhatsApp",
      icon: "💬",
      data: usage.whatsapp,
      included: plan?.includedWhatsappCredits || 0,
      overage: plan?.overageRateWhatsapp.toString() || "0.50",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usage Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track your messaging usage and costs
          </p>
        </div>
        <Link
          href="/dashboard/subscription"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition"
        >
          Manage Subscription
        </Link>
      </div>

      {/* Balance Alert */}
      {balanceStatus === "low" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-red-500 text-2xl mr-3">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-900 mb-1">
                Low Balance Warning
              </h3>
              <p className="text-sm text-red-700">
                Your wallet balance is low (KES{" "}
                {parseFloat(company.walletBalance.toString()).toFixed(2)}). Top
                up to continue sending messages.
              </p>
              <Link
                href="/dashboard"
                className="inline-block mt-2 text-sm font-medium text-red-700 hover:text-red-900 underline"
              >
                Top Up Wallet →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Total Messages
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {totalMessages.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 mt-1">This month</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Total Cost
          </div>
          <div className="text-3xl font-bold text-gray-900">
            KES {totalCost.toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-1">This month</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Wallet Balance
          </div>
          <div className="text-3xl font-bold text-gray-900">
            KES {parseFloat(company.walletBalance.toString()).toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-1">Available</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Active Plan
          </div>
          <div className="text-xl font-bold text-gray-900">
            {plan?.name || "Pay-as-you-go"}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {plan ? `KES ${plan.monthlyPriceKes}/mo` : "No subscription"}
          </p>
        </div>
      </div>

      {/* Channel Usage */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Usage by Channel
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {channels.map((channel) => {
            const percentage = plan
              ? Math.min((channel.data.total / channel.included) * 100, 100)
              : 0;
            const isOverage = plan && channel.data.total > channel.included;
            const remaining = plan
              ? Math.max(channel.included - channel.data.total, 0)
              : 0;

            return (
              <div key={channel.name} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{channel.icon}</span>
                  <span className="font-semibold text-gray-900">
                    {channel.name}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sent</span>
                    <span className="font-medium">
                      {channel.data.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivered</span>
                    <span className="font-medium text-green-600">
                      {channel.data.delivered.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Failed</span>
                    <span className="font-medium text-red-600">
                      {channel.data.failed.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                    <span className="text-gray-900">Cost</span>
                    <span className="text-gray-900">
                      KES {channel.data.cost.toFixed(2)}
                    </span>
                  </div>
                </div>

                {plan && (
                  <div className="pt-3 border-t">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Credits</span>
                      <span>
                        {channel.data.total} / {channel.included}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          isOverage
                            ? "bg-red-500"
                            : percentage > 80
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {isOverage ? (
                      <p className="text-xs text-red-600 mt-1">
                        Using overage rate: KES {channel.overage}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-600 mt-1">
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

      {/* Recent Campaigns */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Campaigns
        </h2>
        {campaigns.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No campaigns this month
          </p>
        ) : (
          <div className="space-y-3">
            {campaigns.slice(0, 5).map((campaign) => (
              <Link
                key={campaign.id}
                href={`/dashboard/campaigns/${campaign.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {campaign.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {campaign.channel.toUpperCase()} •{" "}
                      {campaign.messages.length} messages
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      campaign.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : campaign.status === "sending"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Transactions
        </h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {tx.type === "topup"
                      ? "Wallet Top-up"
                      : `${tx.channel} Message`}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString()} at{" "}
                    {new Date(tx.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`font-semibold ${
                      tx.type === "topup" ? "text-green-600" : "text-gray-900"
                    }`}
                  >
                    {tx.type === "topup" ? "+" : "-"}KES{" "}
                    {tx.amountKes.toString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
