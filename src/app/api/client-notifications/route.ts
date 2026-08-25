import { NextResponse } from "next/server";

import { checkDownloadReminders, readNotifications } from "@/lib/client-notifications/notification-store";

export async function GET() {
  try {
    checkDownloadReminders();
    const notifications = readNotifications();
    return NextResponse.json({
      status: "PASS",
      llm_used: false,
      notifications,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read notifications";
    return NextResponse.json(
      {
        status: "FAIL",
        llm_used: false,
        notifications: [],
        error: message,
      },
      { status: 500 },
    );
  }
}
