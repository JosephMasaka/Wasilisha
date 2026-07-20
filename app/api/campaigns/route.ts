import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dispatchCampaign, resolveAudienceContacts, calculateCost, assertBudget } from "@/lib/campaigns";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      name,
      channel,
      templateId,
      message,
      subject,
      fallbackRuleId,
      status = "sending",
      scheduledAt,
      audienceType = "all",
      contactListId,
      audienceTags = [],
      manualContactIds = [],
    } = await req.json();

    if (!name || !channel || !message) {
      return NextResponse.json({ error: "Name, channel, and message are required" }, { status: 400 });
    }
    if (!["sms", "email", "whatsapp"].includes(channel)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }
    if (channel === "email" && !subject) {
      return NextResponse.json({ error: "Subject is required for email campaigns" }, { status: 400 });
    }
    if (!["draft", "scheduled", "sending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (status === "scheduled" && !scheduledAt) {
      return NextResponse.json({ error: "scheduledAt is required to schedule a campaign" }, { status: 400 });
    }

    const baseData = {
      companyId: session.user.companyId,
      name,
      channel,
      templateId: templateId || null,
      message,
      subject: channel === "email" ? subject : null,
      fallbackRuleId: fallbackRuleId || null,
      audienceType,
      contactListId: audienceType === "list" ? contactListId || null : null,
      audienceTags: audienceType === "tags" ? audienceTags : [],
      manualContactIds: audienceType === "manual" ? manualContactIds : [],
    };

    // Draft or scheduled: persist the definition only. Nothing is charged or
    // queued yet — a scheduled campaign resolves its audience and checks
    // budget at send time via the cron worker, since both can change between
    // now and then.
    if (status === "draft" || status === "scheduled") {
      const campaign = await prisma.campaign.create({
        data: {
          ...baseData,
          status,
          scheduledAt: status === "scheduled" ? new Date(scheduledAt) : null,
        },
      });
      return NextResponse.json({ id: campaign.id, name: campaign.name, status: campaign.status });
    }

    // Send now: validate audience has recipients and budget covers it before
    // creating anything.
    const contacts = await resolveAudienceContacts(session.user.companyId, channel, {
      audienceType,
      contactListId,
      audienceTags,
      manualContactIds,
    });

    if (contacts.length === 0) {
      const channelField =
        channel === "sms" ? "phone numbers" : channel === "email" ? "email addresses" : "WhatsApp IDs";
      return NextResponse.json(
        { error: `No eligible contacts with ${channelField} match this audience` },
        { status: 400 }
      );
    }

    const { totalCost } = calculateCost(channel, message, contacts.length);
    await assertBudget(session.user.companyId, channel, contacts.length, totalCost);

    const campaign = await prisma.campaign.create({
      data: { ...baseData, status: "sending" },
    });

    const { messageCount } = await dispatchCampaign(campaign.id);

    return NextResponse.json({
      id: campaign.id,
      name: campaign.name,
      messageCount,
      totalCost: totalCost.toFixed(2),
    });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create campaign" },
      { status: 500 }
    );
  }
}