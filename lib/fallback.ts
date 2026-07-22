import { prisma } from "./db";
import { messageQueue } from "./queue";
import { Decimal } from "@prisma/client/runtime/library";

export async function scheduleFallback(
  messageId: string,
  campaignId: string,
  fallbackRuleId: string,
  delayMinutes: number
) {
  const triggerAt = new Date();
  triggerAt.setMinutes(triggerAt.getMinutes() + delayMinutes);

  await prisma.campaignFallback.create({
    data: {
      campaignId,
      messageId,
      fallbackRuleId,
      status: "pending",
      triggerAt,
    },
  });
}

export async function processPendingFallbacks() {
  const now = new Date();

  const pendingFallbacks = await prisma.campaignFallback.findMany({
    where: {
      status: "pending",
      triggerAt: {
        lte: now,
      },
    },
    include: {
      message: {
        include: {
          campaign: true,
        },
      },
      campaign: {
        include: {
          company: true,
        },
      },
    },
    take: 50,
  });

  for (const fallback of pendingFallbacks) {
    try {
      const rule = await prisma.fallbackRule.findUnique({
        where: { id: fallback.fallbackRuleId },
      });

      if (!rule || !rule.enabled) {
        await prisma.campaignFallback.update({
          where: { id: fallback.id },
          data: { status: "cancelled" },
        });
        continue;
      }

      const message = fallback.message;

      const shouldTrigger = checkTriggerCondition(
        message.status,
        rule.triggerCondition
      );

      if (!shouldTrigger) {
        await prisma.campaignFallback.update({
          where: { id: fallback.id },
          data: { status: "completed" },
        });
        continue;
      }

      const contact = await prisma.contact.findUnique({
        where: { id: message.contactId },
      });

      if (!contact) {
        await prisma.campaignFallback.update({
          where: { id: fallback.id },
          data: { status: "cancelled" },
        });
        continue;
      }

      let recipientAddress: string | null = null;
      if (rule.fallbackChannel === "sms") recipientAddress = contact.phone;
      else if (rule.fallbackChannel === "email")
        recipientAddress = contact.email;
      else if (rule.fallbackChannel === "whatsapp")
        recipientAddress = contact.whatsappId;

      if (!recipientAddress) {
        await prisma.campaignFallback.update({
          where: { id: fallback.id },
          data: { status: "cancelled" },
        });
        continue;
      }

      const costPerMessage =
        rule.fallbackChannel === "sms"
          ? 0.8
          : rule.fallbackChannel === "email"
          ? 0.1
          : 0.5;

      const fallbackMessage = await prisma.message.create({
        data: {
          campaignId: fallback.campaignId,
          contactId: contact.id,
          channel: rule.fallbackChannel,
          status: "queued",
          costKes: new Decimal(costPerMessage),
        },
      });

      await messageQueue.add("send-message", {
        messageId: fallbackMessage.id,
        campaignId: fallback.campaignId,
        companyId: fallback.campaign.companyId,
        contactId: contact.id,
        channel: rule.fallbackChannel,
        to: recipientAddress,
        content: "", // Would need original message content
        costKes: costPerMessage,
        metadata: {
          isFallback: true,
          originalMessageId: message.id,
        },
      });

      await prisma.campaignFallback.update({
        where: { id: fallback.id },
        data: {
          status: "triggered",
          triggeredAt: new Date(),
          fallbackMessageId: fallbackMessage.id,
        },
      });

      console.log(
        `Fallback triggered: ${rule.primaryChannel} → ${rule.fallbackChannel} for message ${message.id}`
      );
    } catch (error) {
      console.error(`Failed to process fallback ${fallback.id}:`, error);
    }
  }

  return pendingFallbacks.length;
}

function checkTriggerCondition(
  messageStatus: string,
  triggerCondition: string
): boolean {
  switch (triggerCondition) {
    case "undelivered":
      return messageStatus !== "delivered" && messageStatus !== "sent";
    case "bounced":
      return messageStatus === "failed";
    case "unread":
      return messageStatus === "sent" || messageStatus === "delivered";
    default:
      return false;
  }
}
