import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import CampaignsList from "@/components/campaigns/CampaignsList";

export default async function CampaignsPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const campaigns = await prisma.campaign.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { createdAt: "desc" },
    include: {
      messages: true,
    },
  });

  const activeCampaigns = campaigns.filter((c) =>
    ["scheduled", "sending"].includes(c.status)
  );
  const completedCampaigns = campaigns.filter((c) => c.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">
            Create and manage your messaging campaigns
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition"
        >
          Create Campaign
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Total Campaigns
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {campaigns.length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">Active</div>
          <div className="text-3xl font-bold text-orange-600">
            {activeCampaigns.length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-1">
            Completed
          </div>
          <div className="text-3xl font-bold text-green-600">
            {completedCampaigns.length}
          </div>
        </div>
      </div>

      <CampaignsList campaigns={campaigns} />
    </div>
  );
}
