import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = await prisma.fallbackRule.findMany({
      where: {
        companyId: session.user.companyId,
        enabled: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Fetch fallback rules error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rules" },
      { status: 500 }
    );
  }
}
