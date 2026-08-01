import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

type DailyStatRow = {
  date: Date;
  channel: string;
  total: bigint;
  delivered: bigint;
  failed: bigint;
  cost: number;
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const campaigns = await prisma.campaign.findMany({
    where: { companyId: session.user.companyId, createdAt: { gte: thirtyDaysAgo } },
    include: { messages: true },
    orderBy: { createdAt: "desc" },
  });

  const dailyStats = await prisma.$queryRaw<DailyStatRow[]>`
    SELECT
      DATE("createdAt") as date,
      channel,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      SUM("costKes")::DECIMAL as cost
    FROM "Message"
    WHERE "campaignId" IN (
      SELECT id FROM "Campaign" WHERE "companyId" = ${session.user.companyId}
    )
    AND "createdAt" >= ${thirtyDaysAgo}
    GROUP BY DATE("createdAt"), channel
    ORDER BY date DESC
  `;

  const serializedCampaigns = campaigns.map((c) => ({
    ...c,
    messages: c.messages.map((m) => ({ ...m, costKes: m.costKes.toString() })),
  }));

  return (
    <AnalyticsDashboard
      campaigns={serializedCampaigns}
      dailyStats={dailyStats.map((stat) => ({
        date: stat.date.toISOString(),
        channel: stat.channel,
        total: Number(stat.total),
        delivered: Number(stat.delivered),
        failed: Number(stat.failed),
        cost: Number(stat.cost),
      }))}
    />
  );
}