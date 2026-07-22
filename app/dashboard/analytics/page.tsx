import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // Get campaigns from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const campaigns = await prisma.campaign.findMany({
    where: {
      companyId: session.user.companyId,
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    include: {
      messages: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Get daily stats for charts
  const dailyStats = await prisma.$queryRaw<
    Array<{
      date: Date;
      channel: string;
      total: bigint;
      delivered: bigint;
      failed: bigint;
      cost: number;
    }>
  >`
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

  return (
    <AnalyticsDashboard
      campaigns={campaigns}
      dailyStats={dailyStats.map((stat) => ({
        date: stat.date,
        channel: stat.channel,
        total: Number(stat.total),
        delivered: Number(stat.delivered),
        failed: Number(stat.failed),
        cost: Number(stat.cost),
      }))}
    />
  );
}
