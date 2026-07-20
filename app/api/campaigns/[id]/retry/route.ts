import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { retryFailedMessages } from "@/lib/retry";

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

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const result = await retryFailedMessages(id);

    return NextResponse.json({
      success: true,
      queued: result.queued,
      skipped: result.skipped,
      message: `${result.queued} messages queued for retry, ${result.skipped} skipped`,
    });
  } catch (error) {
    console.error("Retry campaign error:", error);
    return NextResponse.json(
      { error: "Failed to retry messages" },
      { status: 500 }
    );
  }
}
