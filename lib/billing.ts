import { prisma } from "./db";
import { Decimal } from "@prisma/client/runtime/library";

export async function shouldUseSubscriptionCredits(
  companyId: string,
  channel: "sms" | "email" | "whatsapp"
): Promise<boolean> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscriptionPlan: true },
  });

  if (
    !company ||
    !company.subscriptionPlan ||
    company.subscriptionStatus !== "active"
  ) {
    return false;
  }

  // Get usage this month
  const usage = await prisma.message.count({
    where: {
      campaign: {
        companyId,
      },
      channel,
      createdAt: {
        gte: new Date(new Date().setDate(1)), // Start of month
      },
    },
  });

  const includedField =
    channel === "sms"
      ? "includedSmsCredits"
      : channel === "email"
      ? "includedEmailCredits"
      : "includedWhatsappCredits";

  const included = company.subscriptionPlan[includedField];

  return usage < included;
}

export async function getEffectiveCost(
  companyId: string,
  channel: "sms" | "email" | "whatsapp",
  defaultCost: number
): Promise<number> {
  const useCredits = await shouldUseSubscriptionCredits(companyId, channel);

  if (useCredits) {
    return 0; // No charge, using subscription credits
  }

  // Check if company has subscription with overage rates
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscriptionPlan: true },
  });

  if (
    company?.subscriptionPlan &&
    company.subscriptionStatus === "active"
  ) {
    const overageField =
      channel === "sms"
        ? "overageRateSms"
        : channel === "email"
        ? "overageRateEmail"
        : "overageRateWhatsapp";

    return parseFloat(company.subscriptionPlan[overageField].toString());
  }

  return defaultCost; // Default pay-as-you-go rate
}

export async function debitForMessage(
  companyId: string,
  channel: "sms" | "email" | "whatsapp",
  cost: number
): Promise<void> {
  const effectiveCost = await getEffectiveCost(companyId, channel, cost);

  if (effectiveCost === 0) {
    // Using subscription credits, no wallet debit needed
    console.log(
      `Message charged against subscription credits (${channel}), no wallet debit`
    );
    return;
  }

  // Debit wallet
  await prisma.$transaction(async (tx) => {
    await tx.company.update({
      where: { id: companyId },
      data: {
        walletBalance: {
          decrement: new Decimal(effectiveCost),
        },
      },
    });

    await tx.walletTransaction.create({
      data: {
        companyId,
        type: "debit",
        amountKes: new Decimal(effectiveCost),
        channel,
        status: "success",
      },
    });
  });
}
