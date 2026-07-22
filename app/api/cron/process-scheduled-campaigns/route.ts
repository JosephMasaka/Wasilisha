import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { messageQueue } from "@/lib/queue";
import { checkBudget, calculateCost } from "@/lib/campaigns";
import { notify } from "@/lib/notifications";

const FAILED_STATUSES: Record<string, string[]> = {
  undelivered: ["failed", "undelivered"],
  bounced: ["bounced", "failed"],
};

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await prisma.campaignFallback.findMany({
    where: { status: "pending", triggerAt: { lte: new Date() } },
    include: { message: { include: { contact: true } }, campaign: true },
  });

  const results = [];
  for (const cf of due) {
    const rule = await prisma.fallbackRule.findUnique({ where: { id: cf.fallbackRuleId } });
    if (!rule) {
      await prisma.campaignFallback.update({ where: { id: cf.id }, data: { status: "cancelled" } });
      continue;
    }

    const relevantStatuses = FAILED_STATUSES[rule.triggerCondition] ?? [];
    if (!relevantStatuses.includes(cf.message.status)) {
      await prisma.campaignFallback.update({ where: { id: cf.id }, data: { status: "completed" } });
      results.push({ id: cf.id, action: "skipped-delivered" });
      continue;
    }

    const contact = cf.message.contact;
    let to: string | null = null;
    if (rule.fallbackChannel === "sms") to = contact.phone;
    else if (rule.fallbackChannel === "email") to = contact.email;
    else if (rule.fallbackChannel === "whatsapp") to = contact.whatsappId;

    if (!to) {
      await prisma.campaignFallback.update({ where: { id: cf.id }, data: { status: "cancelled" } });
      results.push({ id: cf.id, action: "cancelled-no-address" });
      continue;
    }

    // NEW: check budget for this one fallback message before sending it.
    const { totalCost } = calculateCost(rule.fallbackChannel, cf.campaign.message, 1);
    const budget = await checkBudget(cf.campaign.companyId, rule.fallbackChannel, 1, totalCost);

    if (!budget.ok) {
      await prisma.campaignFallback.update({ where: { id: cf.id }, data: { status: "cancelled" } });
      await notify(
        cf.campaign.companyId,
        "fallback_insufficient_balance",
        "Fallback send skipped — low balance",
        `"${cf.campaign.name}" tried to fall back to ${rule.fallbackChannel.toUpperCase()} for one contact, but your wallet balance was too low (KES ${totalCost.toFixed(2)} needed). Top up to resume automatic fallbacks.`,
        { campaignId: cf.campaignId, fallbackId: cf.id, channel: rule.fallbackChannel, costKes: totalCost }
      );
      results.push({ id: cf.id, action: "cancelled-insufficient-balance" });
      continue;
    }

    const fallbackMessage = await prisma.message.create({
      data: {
        campaignId: cf.campaignId,
        contactId: contact.id,
        channel: rule.fallbackChannel,
        status: "queued",
        costKes: cf.message.costKes,
      },
    });

    await messageQueue.add("send-message", {
      messageId: fallbackMessage.id,
      campaignId: cf.campaignId,
      companyId: cf.campaign.companyId,
      contactId: contact.id,
      channel: rule.fallbackChannel,
      to,
      content: cf.campaign.message,
      costKes: parseFloat(cf.message.costKes.toString()),
      metadata: {},
    });

    await prisma.campaignFallback.update({
      where: { id: cf.id },
      data: { status: "triggered", triggeredAt: new Date(), fallbackMessageId: fallbackMessage.id },
    });

    results.push({ id: cf.id, action: "triggered", fallbackMessageId: fallbackMessage.id });
  }

  return NextResponse.json({ processed: results.length, results });
}