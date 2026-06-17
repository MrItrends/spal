import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/conversations — list all conversations for user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, messages, created_at, updated_at, duration")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/conversations", err);
    return NextResponse.json({ success: false, error: "Failed to fetch conversations" }, { status: 500 });
  }
}

// POST /api/conversations — create a new conversation (called when session ends)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { messages, duration } = await req.json();
    if (!messages?.length) return NextResponse.json({ success: false, error: "messages required" }, { status: 400 });

    const firstUserMsg = messages.find((m: { role: string; content: string }) => m.role === "user");
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "…" : "")
      : "Chat";

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("conversations")
      .insert({ user_id: user.id, title, messages, duration: duration ?? 0 })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/conversations", err);
    return NextResponse.json({ success: false, error: "Failed to save conversation" }, { status: 500 });
  }
}
