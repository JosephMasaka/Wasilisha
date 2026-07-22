import { prisma } from "./db";
import { messageQueue } from "./queue";
import { checkBudget, calculateCost } from "./campaigns";
import { notify } from "./notifications";

export async function retryFailedMessages(
  campaignId: string,
  maxRetries = 3
): Promise<{ queued: number; skipped: number }> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      messages: { where: { status: "failed" } },
      company: true,
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  let queued = 0;
  let skipped = 0;

  const retryable = campaign.messages.filter((m) => {
    const retryMatch = m.errorMessage?.match(/Retry (\d+)\/\d+:/);
    const currentRetries = retryMatch ? parseInt(retryMatch[1]) : 0;
    return currentRetries < maxRetries;
  });
  skipped += campaign.messages.length - retryable.length;

  if (retryable.length > 0) {
    const { totalCost } = calculateCost(campaign.channel, campaign.message, retryable.length);
    const budget = await checkBudget(campaign.companyId, campaign.channel, retryable.length, totalCost);
    if (!budget.ok) {
      await notify(
        campaign.companyId,
        "retry_insufficient_balance",
        "Retry skipped — low balance",
        `Retrying ${retryable.length} failed message(s) on "${campaign.name}" needs KES ${totalCost.toFixed(2)}, but your balance is too low. Top up and try again.`,
        { campaignId: campaign.id, costKes: totalCost }
      );
      return { queued: 0, skipped: campaign.messages.length };
    }
  }

  for (const message of retryable) {
    const retryMatch = message.errorMessage?.match(/Retry (\d+)\/\d+:/);
    const currentRetries = retryMatch ? parseInt(retryMatch[1]) : 0;

    const contact = await prisma.contact.findUnique({ where: { id: message.contactId } });
    if (!contact) {
      skipped++;
      continue;
    }

    let recipientAddress: string | null = null;
    if (campaign.channel === "sms") recipientAddress = contact.phone;
    else if (campaign.channel === "email") recipientAddress = contact.email;
    else if (campaign.channel === "whatsapp") recipientAddress = contact.whatsappId;

    if (!recipientAddress) {
      skipped++;
      continue;
    }

    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: "queued",
        errorMessage: `Retry ${currentRetries + 1}/${maxRetries}: ${message.errorMessage || "Previous attempt failed"}`,
      },
    });

    await messageQueue.add("send-message", {
      messageId: message.id,
      campaignId: campaign.id,
      companyId: campaign.companyId,
      contactId: contact.id,
      channel: campaign.channel,
      to: recipientAddress,
      content: campaign.message, // fixed — was "" before
      costKes: parseFloat(message.costKes.toString()),
      metadata: {
        ...(campaign.channel === "email" && { subject: campaign.subject }),
      },
    });

    queued++;
  }

  return { queued, skipped };
}

export async function getDeadLetterMessages(companyId: string) {
  return prisma.message.findMany({
    where: {
      campaign: { companyId },
      status: "failed",
      errorMessage: { contains: "Retry 3/3:" },
    },
    include: { campaign: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}