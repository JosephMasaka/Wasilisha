import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("WhatsApp webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    await prisma.providerWebhookLog.create({
      data: {
        source: "whatsapp",
        rawPayload: payload,
      },
    });

    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.statuses) {
      return NextResponse.json({ received: true });
    }

    for (const status of value.statuses) {
      const messageId = status.id;
      const statusType = status.status;

      const message = await prisma.message.findFirst({
        where: {
          providerMessageId: messageId,
        },
      });

      if (!message) {
        console.warn(`Message not found for WhatsApp ID: ${messageId}`);
        continue;
      }

      if (statusType === "delivered") {
        await prisma.message.update({
          where: { id: message.id },
          data: {
            status: "delivered",
            deliveredAt: new Date(),
          },
        });
        console.log(`WhatsApp message ${message.id} marked as delivered`);
      } else if (statusType === "failed") {
        const errorMessage = status.errors?.[0]?.title || "Delivery failed";
        await prisma.message.update({
          where: { id: message.id },
          data: {
            status: "failed",
            errorMessage,
          },
        });
        console.log(`WhatsApp message ${message.id} failed: ${errorMessage}`);
      } else if (statusType === "read") {
        console.log(`WhatsApp message ${message.id} read by recipient`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
