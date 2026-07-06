import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { enabled } = await req.json();

    const rule = await prisma.fallbackRule.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!rule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    const updated = await prisma.fallbackRule.update({
      where: { id },
      data: { enabled },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Toggle fallback rule error:", error);
    return NextResponse.json(
      { error: "Failed to toggle rule" },
      { status: 500 }
    );
  }
}
