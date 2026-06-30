import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const campaign = await prisma.campaign.findFirst({
    where: {
      id,
      companyId: session.user.companyId,
    },
    include: {
      messages: {
        include: {
          campaign: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!campaign) {
    redirect("/dashboard/campaigns");
  }

  const totalMessages = campaign.messages.length;
  const queuedMessages = campaign.messages.filter((m) => m.status === "queued").length;
  const sentMessages = campaign.messages.filter((m) => m.status === "sent" || m.status === "delivered").length;
  const failedMessages = campaign.messages.filter((m) => m.status === "failed").length;
  const totalCost = campaign.messages.reduce(
    (sum, m) => sum + parseFloat(m.costKes.toString()),
    0
  );

  const statusColors = {
    queued: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link
          href="/dashboard/campaigns"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          ← Back to Campaigns
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {campaign.name}
            </h1>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {campaign.channel.toUpperCase()}
              </span>
              <span className="text-sm text-gray-600">
                Created {new Date(campaign.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-4 mt-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-600 mb-1">Total</div>
            <div className="text-2xl font-bold text-gray-900">{totalMessages}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-600 mb-1">Queued</div>
            <div className="text-2xl font-bold text-gray-600">{queuedMessages}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-600 mb-1">Sent</div>
            <div className="text-2xl font-bold text-blue-600">{sentMessages}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-red-600 mb-1">Failed</div>
            <div className="text-2xl font-bold text-red-600">{failedMessages}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-green-600 mb-1">Cost</div>
            <div className="text-2xl font-bold text-green-600">
              KES {totalCost.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Message Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaign.messages.slice(0, 100).map((message) => (
                <tr key={message.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[message.status as keyof typeof statusColors] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {message.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {message.contactId.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KES {message.costKes.toString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {message.sentAt
                      ? new Date(message.sentAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600">
                    {message.errorMessage || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {campaign.messages.length > 100 && (
          <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-200">
            Showing first 100 of {campaign.messages.length} messages
          </div>
        )}
      </div>
    </div>
  );
}
