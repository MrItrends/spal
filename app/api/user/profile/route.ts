import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/user/profile — fetch current user profile
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("GET /api/user/profile", err);
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PATCH /api/user/profile — update editable profile fields
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { full_name, business_name, business_type, whatsapp_number, currency, avatar_url } = body;

    const updates: Record<string, unknown> = {};
    if (full_name       !== undefined) updates.full_name       = full_name?.trim()       || null;
    if (business_name   !== undefined) updates.business_name   = business_name?.trim()   || null;
    if (business_type   !== undefined) updates.business_type   = business_type           || null;
    if (whatsapp_number !== undefined) updates.whatsapp_number = whatsapp_number?.trim() || null;
    if (currency        !== undefined) updates.currency        = currency                || "NGN";
    if (avatar_url      !== undefined) updates.avatar_url      = avatar_url              || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("PATCH /api/user/profile", err);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
