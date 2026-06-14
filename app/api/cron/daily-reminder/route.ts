import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

webpush.setVapidDetails(
  "mailto:support@spal.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

// Rotating nudges — different each call so users don't tune them out
const NUDGES = [
  { title: "Log your sales today 💰", body: "Tap to record what you made today — takes 10 seconds.", url: "/records/add-sale/voice" },
  { title: "Any expenses today?", body: "Quick — what did you spend money on? Log it now.", url: "/records/add-expense/voice" },
  { title: "Check in with SPAL", body: "How's business going? Ask SPAL anything about your numbers.", url: "/home" },
  { title: "Your daily summary is waiting", body: "See how your business did today.", url: "/home" },
  { title: "Don't forget to log today", body: "A few seconds now keeps your records accurate.", url: "/records" },
  { title: "How did sales go today?", body: "Record it while it's fresh.", url: "/records/add-sale/voice" },
];

export async function GET(req: NextRequest) {
  // Verify cron secret so only Vercel (or your server) can trigger this
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  // Find users who haven't logged a record today
  const { data: activeUsers } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth");

  if (!activeUsers?.length) return NextResponse.json({ sent: 0 });

  // Which users already logged something today?
  const { data: loggedToday } = await supabase
    .from("records")
    .select("user_id")
    .gte("created_at", `${today}T00:00:00Z`)
    .lte("created_at", `${today}T23:59:59Z`);

  const loggedIds = new Set((loggedToday ?? []).map((r) => r.user_id));

  // Pick a nudge deterministically based on hour so everyone gets same message
  const hour = new Date().getHours();
  const nudge = NUDGES[hour % NUDGES.length];

  let sent = 0;
  for (const sub of activeUsers) {
    if (loggedIds.has(sub.user_id)) continue; // already active today, skip

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: nudge.title, body: nudge.body, url: nudge.url }),
      );
      sent++;
    } catch (err: unknown) {
      // 410 Gone = subscription expired, clean it up
      if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      }
    }
  }

  return NextResponse.json({ sent });
}
