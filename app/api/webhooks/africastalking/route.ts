import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const id = formData.get("id")?.toString();
    const status = formData.get("status")?.toString();

    await prisma.providerWebhookLog.create({
      data: {
        source: "africastalking",
        rawPayload: Object.fromEntries(formData),
      },
    });

    if (!id || !status) {
      console.warn("Missing id or status in webhook");
      return NextResponse.json({ received: true });
    }

    const message = await prisma.message.findFirst({
      where: {
        providerMessageId: id,
      },
    });

    if (!message) {
      console.warn(`Message not found for provider ID: ${id}`);
      return NextResponse.json({ received: true });
    }

    if (status === "Success" || status === "Sent") {
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: "delivered",
          deliveredAt: new Date(),
        },
      });
      console.log(`Message ${message.id} marked as delivered`);
    } else if (status === "Failed") {
      const failureReason = formData.get("failureReason")?.toString();
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: "failed",
          errorMessage: failureReason || "Delivery failed",
        },
      });
      console.log(`Message ${message.id} marked as failed: ${failureReason}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Africa's Talking webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
