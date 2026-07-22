import { prisma } from "@/lib/db";
import { messageQueue } from "@/lib/queue";
import { Decimal } from "@prisma/client/runtime/library";
import { AudienceType, CampaignStatus } from "@prisma/client";

const CHANNEL_COSTS = { sms: 0.8, email: 0.1, whatsapp: 0.5 };

export interface AudienceInput {
  audienceType: AudienceType;
  contactListId?: string | null;
  audienceTags?: string[];
  manualContactIds?: string[];
}

export async function resolveAudienceContacts(
  companyId: string,
  channel: string,
  audience: AudienceInput
) {
  const channelFilter: Record<string, unknown> = { companyId };
  if (channel === "sms") channelFilter.phone = { not: null };
  else if (channel === "email") channelFilter.email = { not: null };
  else if (channel === "whatsapp") channelFilter.whatsappId = { not: null };

  switch (audience.audienceType) {
    case "list":
      if (!audience.contactListId) return [];
      return prisma.contact.findMany({
        where: { ...channelFilter, contactLists: { some: { id: audience.contactListId } } },
      });
    case "tags":
      if (!audience.audienceTags?.length) return [];
      return prisma.contact.findMany({
        where: { ...channelFilter, tags: { hasSome: audience.audienceTags } },
      });
    case "manual":
      if (!audience.manualContactIds?.length) return [];
      return prisma.contact.findMany({
        where: { ...channelFilter, id: { in: audience.manualContactIds } },
      });
    case "all":
    default:
      return prisma.contact.findMany({ where: channelFilter });
  }
}

export function calculateCost(channel: string, message: string, recipientCount: number) {
  let costPerContact = CHANNEL_COSTS[channel as keyof typeof CHANNEL_COSTS];
  if (channel === "sms") {
    costPerContact = CHANNEL_COSTS.sms * Math.ceil(message.length / 160);
  }
  return { costPerContact, totalCost: costPerContact * recipientCount };
}

export interface BudgetCheck {
  ok: boolean;
  reason?: string;
  balance?: number;
}

/** Non-throwing check — used by the fallback/retry workers, which need to
 * keep processing other rows even when one company can't afford a send. */
export async function checkBudget(
  companyId: string,
  channel: string,
  recipientCount: number,
  totalCost: number
): Promise<BudgetCheck> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscriptionPlan: true },
  });
  if (!company) return { ok: false, reason: "Company not found" };

  let hasSubscriptionCredits = false;
  if (company.subscriptionPlan && company.subscriptionStatus === "active") {
    const usage = await prisma.message.count({
      where: {
        campaign: { companyId },
        channel,
        createdAt: { gte: new Date(new Date().setDate(1)) },
      },
    });
    const includedField =
      channel === "sms"
        ? "includedSmsCredits"
        : channel === "email"
        ? "includedEmailCredits"
        : "includedWhatsappCredits";
    const included = company.subscriptionPlan[includedField as keyof typeof company.subscriptionPlan] as number;
    if (included - usage >= recipientCount) hasSubscriptionCredits = true;
  }

  if (hasSubscriptionCredits) return { ok: true };

  const balance = parseFloat(company.walletBalance.toString());
  if (balance < totalCost) {
    return {
      ok: false,
      balance,
      reason: `Insufficient balance. Need KES ${totalCost.toFixed(2)}, have KES ${balance.toFixed(2)}.`,
    };
  }
  return { ok: true, balance };
}

/** Throwing wrapper — used by dispatchCampaign and the campaigns route,
 * where "stop and surface the error" is the right behavior. */
export async function assertBudget(
  companyId: string,
  channel: string,
  recipientCount: number,
  totalCost: number
) {
  const result = await checkBudget(companyId, channel, recipientCount, totalCost);
  if (!result.ok) throw new Error(result.reason);
}

/**
 * Resolves the audience, checks budget, creates Message rows, queues each
 * one, and schedules a CampaignFallback row per message if the campaign has
 * an enabled fallback rule. Used both for "send now" and by the scheduled-
 * campaign cron worker, so a scheduled send goes through the exact same
 * checks a live one does.
 */
export async function dispatchCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { fallbackRule: true },
  });
  if (!campaign) throw new Error("Campaign not found");

  const dispatchable: CampaignStatus[] = ["scheduled", "sending"];
  if (!dispatchable.includes(campaign.status)) {
    throw new Error(`Campaign is not in a dispatchable state (${campaign.status})`);
  }

  const contacts = await resolveAudienceContacts(campaign.companyId, campaign.channel, {
    audienceType: campaign.audienceType,
    contactListId: campaign.contactListId,
    audienceTags: campaign.audienceTags,
    manualContactIds: campaign.manualContactIds,
  });

  if (contacts.length === 0) {
    await prisma.campaign.update({ where: { id: campaignId }, data: { status: "failed" } });
    throw new Error("No eligible contacts found for this campaign's audience");
  }

  const { costPerContact, totalCost } = calculateCost(campaign.channel, campaign.message, contacts.length);
  await assertBudget(campaign.companyId, campaign.channel, contacts.length, totalCost);

  const messageRecords = await prisma.$transaction(
    contacts.map((contact) =>
      prisma.message.create({
        data: {
          campaignId: campaign.id,
          contactId: contact.id,
          channel: campaign.channel,
          status: "queued",
          costKes: new Decimal(costPerContact),
        },
      })
    )
  );

  for (const record of messageRecords) {
    const contact = contacts.find((c) => c.id === record.contactId);
    if (!contact) continue;

    let to: string | null = null;
    if (campaign.channel === "sms") to = contact.phone;
    else if (campaign.channel === "email") to = contact.email;
    else if (campaign.channel === "whatsapp") to = contact.whatsappId;
    if (!to) continue;

    await messageQueue.add("send-message", {
      messageId: record.id,
      campaignId: campaign.id,
      companyId: campaign.companyId,
      contactId: contact.id,
      channel: campaign.channel,
      to,
      content: campaign.message,
      costKes: costPerContact,
      metadata: {
        ...(campaign.channel === "email" && { subject: campaign.subject }),
      },
    });

    if (campaign.fallbackRule && campaign.fallbackRule.enabled) {
      const triggerAt = new Date(Date.now() + campaign.fallbackRule.delayMinutes * 60_000);
      await prisma.campaignFallback.create({
        data: {
          campaignId: campaign.id,
          messageId: record.id,
          fallbackRuleId: campaign.fallbackRule.id,
          status: "pending",
          triggerAt,
        },
      });
    }
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "sending", recipientCount: messageRecords.length },
  });

  return { messageCount: messageRecords.length, totalCost };
}