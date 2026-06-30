import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { messageQueue } from "@/lib/queue";
import { Decimal } from "@prisma/client/runtime/library";

const CHANNEL_COSTS = {
  sms: 0.8,
  email: 0.1,
  whatsapp: 0.5,
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, channel, templateId, message, subject } = await req.json();

    if (!name || !channel || !message) {
      return NextResponse.json(
        { error: "Name, channel, and message are required" },
        { status: 400 }
      );
    }

    if (!["sms", "email", "whatsapp"].includes(channel)) {
      return NextResponse.json(
        { error: "Invalid channel" },
        { status: 400 }
      );
    }

    if (channel === "email" && !subject) {
      return NextResponse.json(
        { error: "Subject is required for email campaigns" },
        { status: 400 }
      );
    }

    const contactFilter: Record<string, unknown> = {
      companyId: session.user.companyId,
    };

    if (channel === "sms") {
      contactFilter.phone = { not: null };
    } else if (channel === "email") {
      contactFilter.email = { not: null };
    } else if (channel === "whatsapp") {
      contactFilter.whatsappId = { not: null };
    }

    const contacts = await prisma.contact.findMany({
      where: contactFilter,
    });

    if (contacts.length === 0) {
      const channelField =
        channel === "sms"
          ? "phone numbers"
          : channel === "email"
          ? "email addresses"
          : "WhatsApp IDs";
      return NextResponse.json(
        { error: `No contacts with ${channelField} found` },
        { status: 400 }
      );
    }

    let costPerContact = CHANNEL_COSTS[channel as keyof typeof CHANNEL_COSTS];

    if (channel === "sms") {
      const smsCount = Math.ceil(message.length / 160);
      costPerContact = CHANNEL_COSTS.sms * smsCount;
    }

    const totalCost = costPerContact * contacts.length;

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      include: { subscriptionPlan: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if company has subscription with credits
    let hasSubscriptionCredits = false;
    if (
      company.subscriptionPlan &&
      company.subscriptionStatus === "active"
    ) {
      // Get usage this month
      const usage = await prisma.message.count({
        where: {
          campaign: {
            companyId: session.user.companyId,
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
      const remaining = included - usage;

      if (remaining >= recipientCount) {
        hasSubscriptionCredits = true;
      }
    }

    // If no subscription credits, check wallet balance
    if (!hasSubscriptionCredits) {
      const balance = parseFloat(company.walletBalance.toString());
      if (balance < totalCost) {
        return NextResponse.json(
          {
            error: `Insufficient balance. Need KES ${totalCost.toFixed(2)}, have KES ${balance.toFixed(2)}. ${
              company.subscriptionPlan
                ? "Subscription credits exhausted."
                : "Consider subscribing for included credits."
            }`,
          },
          { status: 400 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          companyId: session.user.companyId,
          name,
          channel,
          templateId: templateId || null,
          status: "sending",
        },
      });

      const messageRecords = await Promise.all(
        contacts.map((contact) =>
          tx.message.create({
            data: {
              campaignId: campaign.id,
              contactId: contact.id,
              channel,
              status: "queued",
              costKes: new Decimal(costPerContact),
            },
          })
        )
      );

      for (const messageRecord of messageRecords) {
        const contact = contacts.find((c) => c.id === messageRecord.contactId);
        if (!contact) continue;

        let recipientAddress: string | null = null;
        if (channel === "sms") recipientAddress = contact.phone;
        else if (channel === "email") recipientAddress = contact.email;
        else if (channel === "whatsapp") recipientAddress = contact.whatsappId;

        if (!recipientAddress) continue;

        await messageQueue.add("send-message", {
          messageId: messageRecord.id,
          campaignId: campaign.id,
          companyId: session.user.companyId,
          contactId: contact.id,
          channel,
          to: recipientAddress,
          content: message,
          costKes: costPerContact,
          metadata: {
            ...(channel === "email" && { subject }),
          },
        });
      }

      return { campaign, messageCount: messageRecords.length };
    });

    return NextResponse.json({
      id: result.campaign.id,
      name: result.campaign.name,
      messageCount: result.messageCount,
      totalCost: totalCost.toFixed(2),
    });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create campaign",
      },
      { status: 500 }
    );
  }
}
