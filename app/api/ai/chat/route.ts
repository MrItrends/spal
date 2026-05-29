import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { askSPAL } from "@/lib/openai/chat";
import { todayISO, weekStartISO } from "@/lib/utils/dates";

// POST /api/ai/chat — Ask SPAL a question
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { message, conversationId } = await req.json();
    if (!message?.trim()) return NextResponse.json({ success: false, error: "Message required" }, { status: 400 });

    // Get user context
    const { data: userData } = await supabase
      .from("users")
      .select("full_name, business_type, business_name, currency")
      .eq("id", user.id)
      .single();

    // Fetch actual records for the last 8 days — source of truth, always up to date
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    const { data: recentRecords } = await supabase
      .from("records")
      .select("type, amount, description, category, created_at")
      .eq("user_id", user.id)
      .gte("created_at", eightDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(100);

    // Compute per-day totals from records
    const dailyMap: Record<string, { sales: number; expenses: number; profit: number }> = {};
    for (const r of (recentRecords ?? [])) {
      const date = r.created_at.split("T")[0]; // YYYY-MM-DD (UTC)
      if (!dailyMap[date]) dailyMap[date] = { sales: 0, expenses: 0, profit: 0 };
      const amt = Number(r.amount);
      if (r.type === "sale") {
        dailyMap[date].sales   += amt;
        dailyMap[date].profit  += amt;
      } else {
        dailyMap[date].expenses += amt;
        dailyMap[date].profit   -= amt;
      }
    }
    const dailyBreakdown = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b)) // oldest first
      .map(([date, totals]) => ({ date, ...totals }));

    // Keep fetching summaries as a fallback for days not covered by records window
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: summaries } = await supabase
      .from("daily_summaries")
      .select("summary_date, total_sales, total_expenses, profit")
      .eq("user_id", user.id)
      .gte("summary_date", weekAgo.toISOString().split("T")[0])
      .order("summary_date", { ascending: true });

    // Load or create conversation
    const admin = createAdminClient();
    let conversation = null;
    if (conversationId) {
      const { data } = await admin
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single();
      conversation = data;
    }

    const history = conversation?.messages ?? [];
    const newUserMsg = { role: "user" as const, content: message, timestamp: new Date().toISOString() };

    // Call OpenAI
    const reply = await askSPAL({
      message,
      history,
      user: userData ?? {},
      summaries: summaries ?? [],
      dailyBreakdown,
      recentRecords: (recentRecords ?? []).slice(0, 30).map(r => ({
        type:        r.type,
        amount:      Number(r.amount),
        description: r.description ?? r.category ?? r.type,
        date:        r.created_at.split("T")[0],
      })),
      currency: userData?.currency ?? "NGN",
    });

    const newAssistantMsg = { role: "assistant" as const, content: reply, timestamp: new Date().toISOString() };
    const updatedMessages = [...history, newUserMsg, newAssistantMsg];

    // Save conversation
    let savedConvId = conversationId;
    if (conversation) {
      await admin.from("conversations").update({
        messages: updatedMessages,
        updated_at: new Date().toISOString(),
      }).eq("id", conversationId);
    } else {
      const { data: newConv } = await admin
        .from("conversations")
        .insert({ user_id: user.id, messages: updatedMessages })
        .select("id")
        .single();
      savedConvId = newConv?.id;
    }

    return NextResponse.json({
      success: true,
      data: { reply, conversationId: savedConvId },
    });
  } catch (err) {
    console.error("POST /api/ai/chat", err);
    return NextResponse.json({ success: false, error: "Failed to get response" }, { status: 500 });
  }
}
