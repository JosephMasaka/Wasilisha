import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/paystack";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    const rawBody = await req.text();
    const isValid = verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);

    await prisma.providerWebhookLog.create({
      data: {
        source: "paystack",
        rawPayload: payload,
      },
    });

    if (payload.event === "charge.success") {
      const reference = payload.data.reference;
      const amountInKobo = payload.data.amount;
      const amountKes = amountInKobo / 100;

      const transaction = await prisma.walletTransaction.findFirst({
        where: {
          paystackReference: reference,
          status: "pending",
        },
        include: {
          company: true,
        },
      });

      if (!transaction) {
        console.warn(`Transaction not found for reference: ${reference}`);
        return NextResponse.json({ received: true });
      }

      await prisma.$transaction(async (tx) => {
        const company = await tx.company.findUnique({
          where: { id: transaction.companyId },
        });

        if (!company) {
          throw new Error("Company not found");
        }

        await tx.company.update({
          where: { id: transaction.companyId },
          data: {
            walletBalance: {
              increment: new Decimal(amountKes),
            },
          },
        });

        await tx.walletTransaction.update({
          where: { id: transaction.id },
          data: {
            status: "success",
          },
        });
      });

      console.log(`Wallet topped up: ${reference}, amount: KES ${amountKes}`);
    }

    if (payload.event === "charge.failed") {
      const reference = payload.data.reference;

      await prisma.walletTransaction.updateMany({
        where: {
          paystackReference: reference,
          status: "pending",
        },
        data: {
          status: "failed",
        },
      });

      console.log(`Charge failed: ${reference}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
