import { NextRequest, NextResponse } from "next/server";
import { checkJobAlerts } from "@/lib/job-alert-checker";

export async function POST(request: NextRequest) {
  // Simple cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
