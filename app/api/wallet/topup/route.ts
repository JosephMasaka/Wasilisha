import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initiateCharge } from "@/lib/paystack";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, phone } = await req.json();

    if (!amount || !phone) {
      return NextResponse.json(
        { error: "Amount and phone number are required" },
        { status: 400 }
      );
    }

    if (amount < 10) {
      return NextResponse.json(
        { error: "Minimum top-up amount is KES 10" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const chargeResult = await initiateCharge(company.email, amount, phone);

    await prisma.walletTransaction.create({
      data: {
        companyId: company.id,
        type: "topup",
        amountKes: new Decimal(amount),
        paystackReference: chargeResult.data.reference,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      reference: chargeResult.data.reference,
      message: "M-Pesa prompt sent. Please complete payment on your phone.",
    });
  } catch (error) {
    console.error("Top-up error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to initiate top-up" },
      { status: 500 }
    );
  }
}
