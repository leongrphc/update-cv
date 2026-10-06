import { NextRequest, NextResponse } from "next/server";
import { checkJobAlerts } from "@/lib/job-alert-checker";
import { timingSafeEqual } from "crypto";

export async function POST(request: NextRequest) {
  // Simple cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ success: false, error: "Cron not configured" }, { status: 503 });
  }
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const supplied = Buffer.from(authHeader || "");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await checkJobAlerts();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Cron check-alerts error:", error);
    return NextResponse.json(
      { success: false, error: "Alert check failed" },
      { status: 500 }
    );
  }
}
