import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function FailedMessagesPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // Get all failed messages
  const failedMessages = await prisma.message.findMany({
    where: {
      campaign: {
        companyId: session.user.companyId,
      },
      status: "failed",
    },
    include: {
      campaign: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  const deadLetterMessages = failedMessages.filter((m) =>
    m.errorMessage?.includes("Retry 3/3:")
  );
  const retryableMessages = failedMessages.filter(
    (m) => !m.errorMessage?.includes("Retry 3/3:")
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Failed Messages</h1>
        <p className="text-gray-600 mt-1">
          Monitor and retry failed message deliveries
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-200">
          <div className="text-sm font-medium text-red-700 mb-1">
            Total Failed
          </div>
          <div className="text-3xl font-bold text-red-600">
            {failedMessages.length}
          </div>
          <p className="text-xs text-red-600 mt-1">Last 100 shown</p>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg shadow-sm border border-yellow-200">
          <div className="text-sm font-medium text-yellow-700 mb-1">
            Retryable
          </div>
          <div className="text-3xl font-bold text-yellow-600">
            {retryableMessages.length}
          </div>
          <p className="text-xs text-yellow-600 mt-1">Can be retried</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-1">
            Dead Letter Queue
          </div>
          <div className="text-3xl font-bold text-gray-600">
            {deadLetterMessages.length}
          </div>
          <p className="text-xs text-gray-600 mt-1">Max retries reached</p>
        </div>
      </div>

      {/* Retryable Messages */}
      {retryableMessages.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Retryable Failures
          </h2>
          <div className="space-y-2">
            {retryableMessages.slice(0, 20).map((message) => (
              <div
                key={message.id}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Link
                      href={`/dashboard/campaigns/${message.campaignId}`}
                      className="font-medium text-primary-600 hover:underline"
                    >
                      {message.campaign.name}
                    </Link>
                    <p className="text-sm text-gray-600">
                      {message.channel.toUpperCase()} •{" "}
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                    FAILED
                  </span>
                </div>
                <p className="text-sm text-red-600 mb-2">
                  {message.errorMessage || "Unknown error"}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Message ID: {message.id.slice(0, 8)}...</span>
                  <span>Cost: KES {message.costKes.toString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dead Letter Queue */}
      {deadLetterMessages.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start mb-4">
            <div className="text-yellow-500 text-2xl mr-3">⚠️</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Dead Letter Queue
              </h2>
              <p className="text-sm text-gray-600">
                These messages have failed after 3 retry attempts. Manual
                investigation required.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {deadLetterMessages.slice(0, 20).map((message) => (
              <div
                key={message.id}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Link
                      href={`/dashboard/campaigns/${message.campaignId}`}
                      className="font-medium text-primary-600 hover:underline"
                    >
                      {message.campaign.name}
                    </Link>
                    <p className="text-sm text-gray-600">
                      {message.channel.toUpperCase()} •{" "}
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full">
                    DEAD LETTER
                  </span>
                </div>
                <p className="text-sm text-red-600 mb-2 font-mono">
                  {message.errorMessage}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Message ID: {message.id}</span>
                  <span>Cost: KES {message.costKes.toString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {failedMessages.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Failed Messages
          </h3>
          <p className="text-gray-600">
            All your messages are being delivered successfully!
          </p>
        </div>
      )}
    </div>
  );
}
