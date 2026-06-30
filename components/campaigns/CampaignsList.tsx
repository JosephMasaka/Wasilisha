"use client";

import { Campaign, Message } from "@prisma/client";
import Link from "next/link";

interface CampaignsListProps {
  campaigns: (Campaign & { messages: Message[] })[];
}

export default function CampaignsList({ campaigns }: CampaignsListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 text-5xl mb-4">📨</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No campaigns yet
        </h3>
        <p className="text-gray-600 mb-4">
          Create your first campaign to start sending messages
        </p>
      </div>
    );
  }

  const statusColors = {
    draft: "bg-gray-100 text-gray-800",
    scheduled: "bg-yellow-100 text-yellow-800",
    sending: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  const channelIcons = {
    sms: "📱",
    email: "✉️",
    whatsapp: "💬",
  };

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => {
        const totalMessages = campaign.messages.length;
        const sentMessages = campaign.messages.filter(
          (m) => m.status === "sent" || m.status === "delivered"
        ).length;
        const failedMessages = campaign.messages.filter(
          (m) => m.status === "failed"
        ).length;

        return (
          <Link
            key={campaign.id}
            href={`/dashboard/campaigns/${campaign.id}`}
            className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">
                    {channelIcons[campaign.channel as keyof typeof channelIcons]}
                  </span>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {campaign.name}
                  </h3>
                </div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    statusColors[campaign.status as keyof typeof statusColors]
                  }`}
                >
                  {campaign.status.toUpperCase()}
                </span>
              </div>
              <div className="text-right text-sm text-gray-600">
                <div>
                  Created {new Date(campaign.createdAt).toLocaleDateString()}
                </div>
                {campaign.scheduledAt && (
                  <div className="text-xs text-gray-500">
                    Scheduled for{" "}
                    {new Date(campaign.scheduledAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {totalMessages > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-600">Total</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {totalMessages}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Sent</div>
                    <div className="text-lg font-semibold text-green-600">
                      {sentMessages}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Failed</div>
                    <div className="text-lg font-semibold text-red-600">
                      {failedMessages}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
