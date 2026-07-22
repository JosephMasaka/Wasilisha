import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SubscriptionManager from "@/components/subscription/SubscriptionManager";

export default async function SubscriptionPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const [company, plans] = await Promise.all([
    prisma.company.findUnique({
      where: { id: session.user.companyId },
      include: { subscriptionPlan: true },
    }),
    prisma.subscriptionPlan.findMany({ orderBy: { monthlyPriceKes: "asc" } }),
  ]);
  if (!company) redirect("/auth/signin");

  const usage = await prisma.message.groupBy({
    by: ["channel"],
    where: {
      campaign: { companyId: session.user.companyId },
      createdAt: { gte: new Date(new Date().setDate(1)) },
    },
    _count: true,
  });

  const usageStats = {
    sms: usage.find((u) => u.channel === "sms")?._count || 0,
    email: usage.find((u) => u.channel === "email")?._count || 0,
    whatsapp: usage.find((u) => u.channel === "whatsapp")?._count || 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl" style={{ color: "var(--text)" }}>Subscription</h1>
        <p className="mt-1" style={{ color: "var(--text-muted)" }}>Manage your subscription plan and usage</p>
      </div>
      <SubscriptionManager company={company} plans={plans} usage={usageStats} />
    </div>
  );
}