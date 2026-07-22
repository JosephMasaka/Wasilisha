import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const APP_URL = process.env.APP_URL || process.env.NEXTAUTH_URL;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    const [plan, company] = await Promise.all([
      prisma.subscriptionPlan.findUnique({ where: { id: planId } }),
      prisma.company.findUnique({ where: { id: session.user.companyId } }),
    ]);

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Initialize Paystack transaction
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: company.email,
          amount: plan.monthlyPriceKes * 100, // Convert to kobo
          currency: "KES",
          callback_url: `${APP_URL}/dashboard/subscription/callback`,
          metadata: {
            company_id: company.id,
            plan_id: plan.id,
            type: "subscription",
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to initialize payment");
    }

    const data = await response.json();

    return NextResponse.json({
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process subscription",
      },
      { status: 500 }
    );
  }
}
