import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils/dates";
import { checkAndAwardBadges } from "@/lib/gamification/badges";

// GET /api/records — fetch records for current user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const date      = searchParams.get("date");       // YYYY-MM-DD
    const startDate = searchParams.get("start_date"); // YYYY-MM-DD
    const endDate   = searchParams.get("end_date");   // YYYY-MM-DD
    const type      = searchParams.get("type");       // sale | expense
    const limit     = parseInt(searchParams.get("limit") ?? "50");

    let query = supabase
      .from("records")
      .select("*")
      .eq("user_id", user.id)
      .order("record_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (date)      query = query.eq("record_date", date);
    if (startDate) query = query.gte("record_date", startDate);
    if (endDate)   query = query.lte("record_date", endDate);
    if (type)      query = query.eq("type", type);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/records", err);
    return NextResponse.json({ success: false, error: "Failed to fetch records" }, { status: 500 });
  }
}

// POST /api/records — create a new record
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, amount, description, category, input_method, raw_input, record_date } = body;

    if (!type || !amount) {
      return NextResponse.json({ success: false, error: "type and amount are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("records")
      .insert({
        user_id: user.id,
        type,
        amount: parseFloat(amount),
        description: description?.trim() || null,
        category: category?.trim() || null,
        input_method: input_method || "text",
        raw_input: raw_input || null,
        record_date: record_date || todayISO(),
      })
      .select()
      .single();

    if (error) throw error;

    // ── Badge checks (non-fatal) ──────────────────────────────────────────────
    let newBadges: unknown[] = [];
    try {
      // Get counts needed for badge evaluation
      const [{ count: totalRecords }, { count: totalSales }, { data: userRow }] = await Promise.all([
        supabase.from("records").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("records").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "sale"),
        supabase.from("users").select("streak_days").eq("id", user.id).single(),
      ]);

      newBadges = await checkAndAwardBadges(supabase, user.id, "record_saved", {
        totalRecords:  totalRecords  ?? 0,
        totalSales:    totalSales    ?? 0,
        streakDays:    userRow?.streak_days ?? 0,
      });

      // Update weekly challenge progress
      try {
        const weekStart = (() => {
          const now = new Date();
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          return new Date(now.setDate(diff)).toISOString().split("T")[0];
        })();

        const { data: challenge } = await supabase
          .from("user_challenges")
          .select("*")
          .eq("user_id", user.id)
          .eq("week_start", weekStart)
          .single();

        if (challenge && !challenge.completed) {
          let progress = challenge.current_progress;

          if (challenge.challenge_type === "total_records") {
            progress += 1;
          } else if (challenge.challenge_type === "daily_streak") {
            progress = userRow?.streak_days ?? progress;
          }

          const completed = progress >= challenge.target;
          await supabase
            .from("user_challenges")
            .update({
              current_progress: Math.min(progress, challenge.target),
              completed,
              completed_at: completed ? new Date().toISOString() : null,
            })
            .eq("id", challenge.id);

          // Award challenge badge if just completed
          if (completed) {
            const challengeBadges = await checkAndAwardBadges(supabase, user.id, "challenge_complete");
            newBadges = [...newBadges, ...challengeBadges];
          }
        }
      } catch { /* non-fatal */ }
    } catch { /* badge errors never fail the record save */ }

    return NextResponse.json({ success: true, data, newBadges }, { status: 201 });
  } catch (err) {
    console.error("POST /api/records", err);
    return NextResponse.json({ success: false, error: "Failed to save record" }, { status: 500 });
  }
}

// PATCH /api/records — update a record
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id, amount, description, category, record_date } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (amount      !== undefined) updates.amount      = parseFloat(amount);
    if (description !== undefined) updates.description = description?.trim() || null;
    if (category    !== undefined) updates.category    = category?.trim() || null;
    if (record_date !== undefined) updates.record_date = record_date;

    const { data, error } = await supabase
      .from("records")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("PATCH /api/records", err);
    return NextResponse.json({ success: false, error: "Failed to update record" }, { status: 500 });
  }
}

// DELETE /api/records?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

    const { error } = await supabase
      .from("records")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/records", err);
    return NextResponse.json({ success: false, error: "Failed to delete record" }, { status: 500 });
  }
}
