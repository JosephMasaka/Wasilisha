import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import WalletCard from "@/components/WalletCard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    include: {
      walletTransactions: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!company) {
    redirect("/auth/signin");
  }

  const stats = await prisma.$transaction([
    prisma.contact.count({
      where: { companyId: session.user.companyId },
    }),
    prisma.campaign.count({
      where: { companyId: session.user.companyId },
    }),
    prisma.message.count({
      where: {
        campaign: {
          companyId: session.user.companyId,
        },
        status: "delivered",
      },
    }),
  ]);

  const [contactCount, campaignCount, deliveredCount] = stats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {session.user.companyName}</p>
      </div>

      <WalletCard
        balance={company.walletBalance.toString()}
        companyId={company.id}
      />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">Total Contacts</div>
          <div className="text-3xl font-bold text-gray-900">{contactCount}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">Campaigns</div>
          <div className="text-3xl font-bold text-gray-900">{campaignCount}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">Messages Delivered</div>
          <div className="text-3xl font-bold text-gray-900">{deliveredCount}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="p-6">
          {company.walletTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {company.walletTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {tx.type === "topup" ? "Wallet Top-up" : `${tx.channel} Message`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString()} at{" "}
                      {new Date(tx.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`text-sm font-medium ${
                        tx.status === "success"
                          ? "text-green-600"
                          : tx.status === "pending"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {tx.status}
                    </span>
                    <span
                      className={`font-semibold ${
                        tx.type === "topup" ? "text-green-600" : "text-gray-900"
                      }`}
                    >
                      {tx.type === "topup" ? "+" : "-"}KES {tx.amountKes.toString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
