import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, primaryChannel, fallbackChannel, triggerCondition, delayMinutes } = await req.json();

    if (!name || !primaryChannel || !fallbackChannel || !triggerCondition || !delayMinutes) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (primaryChannel === fallbackChannel) {
      return NextResponse.json(
        { error: "Primary and fallback channels must be different" },
        { status: 400 }
      );
    }

    if (!["sms", "email", "whatsapp"].includes(primaryChannel) ||
        !["sms", "email", "whatsapp"].includes(fallbackChannel)) {
      return NextResponse.json(
        { error: "Invalid channel" },
        { status: 400 }
      );
    }

    if (!["undelivered", "unread", "bounced"].includes(triggerCondition)) {
      return NextResponse.json(
        { error: "Invalid trigger condition" },
        { status: 400 }
      );
    }

    const rule = await prisma.fallbackRule.create({
      data: {
        companyId: session.user.companyId,
        name,
        primaryChannel,
        fallbackChannel,
        triggerCondition,
        delayMinutes,
        enabled: true,
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error("Create fallback rule error:", error);
    return NextResponse.json(
      { error: "Failed to create fallback rule" },
      { status: 500 }
    );
  }
}
