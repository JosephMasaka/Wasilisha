import { NextResponse } from "next/server";
import { processPendingFallbacks } from "@/lib/fallback";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET || "fallback-processor-secret";

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const processed = await processPendingFallbacks();

    return NextResponse.json({
      success: true,
      processed,
      message: `Processed ${processed} pending fallbacks`,
    });
  } catch (error) {
    console.error("Process fallbacks error:", error);
    return NextResponse.json(
      { error: "Failed to process fallbacks" },
      { status: 500 }
    );
  }
}
