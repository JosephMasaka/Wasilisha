import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import UsageDashboard from "@/components/usage/UsageDashboard";

export default async function UsagePage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    include: { subscriptionPlan: true },
  });

  if (!company) {
    redirect("/auth/signin");
  }

  // Get current month usage
  const startOfMonth = new Date(new Date().setDate(1));
  startOfMonth.setHours(0, 0, 0, 0);

  const [currentMonthUsage, campaigns, recentTransactions] = await Promise.all([
    prisma.message.groupBy({
      by: ["channel", "status"],
      where: {
        campaign: {
          companyId: session.user.companyId,
        },
        createdAt: {
          gte: startOfMonth,
        },
      },
      _count: true,
      _sum: {
        costKes: true,
      },
    }),
    prisma.campaign.findMany({
      where: {
        companyId: session.user.companyId,
        createdAt: {
          gte: startOfMonth,
        },
      },
      include: {
        messages: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.walletTransaction.findMany({
      where: {
        companyId: session.user.companyId,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Organize usage by channel
  const usage = {
    sms: {
      total: 0,
      delivered: 0,
      failed: 0,
      cost: 0,
    },
    email: {
      total: 0,
      delivered: 0,
      failed: 0,
      cost: 0,
    },
    whatsapp: {
      total: 0,
      delivered: 0,
      failed: 0,
      cost: 0,
    },
  };

  currentMonthUsage.forEach((item) => {
    const channel = item.channel as "sms" | "email" | "whatsapp";
    if (usage[channel]) {
      usage[channel].total += item._count;
      if (item.status === "delivered") {
        usage[channel].delivered += item._count;
      } else if (item.status === "failed") {
        usage[channel].failed += item._count;
      }
      usage[channel].cost += parseFloat(item._sum.costKes?.toString() || "0");
    }
  });

  return (
    <UsageDashboard
      company={company}
      usage={usage}
      campaigns={campaigns}
      transactions={recentTransactions}
    />
  );
}
