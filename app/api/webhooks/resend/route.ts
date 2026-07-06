import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    await prisma.providerWebhookLog.create({
      data: {
        source: "resend",
        rawPayload: payload,
      },
    });

    const { type, data } = payload;

    if (!data?.email_id) {
      console.warn("Missing email_id in Resend webhook");
      return NextResponse.json({ received: true });
    }

    const message = await prisma.message.findFirst({
      where: {
        providerMessageId: data.email_id,
      },
    });

    if (!message) {
      console.warn(`Message not found for Resend email_id: ${data.email_id}`);
      return NextResponse.json({ received: true });
    }

    if (type === "email.delivered") {
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: "delivered",
          deliveredAt: new Date(),
        },
      });
      console.log(`Email ${message.id} marked as delivered`);
    } else if (type === "email.bounced" || type === "email.complained") {
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: "failed",
          errorMessage: `Email ${type.split(".")[1]}`,
        },
      });
      console.log(`Email ${message.id} marked as failed: ${type}`);
    } else if (type === "email.opened") {
      console.log(`Email ${message.id} opened`);
    } else if (type === "email.clicked") {
      console.log(`Email ${message.id} clicked`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Resend webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
