import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/inventory/[id] — update item (quantity, name, unit, threshold, cost)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name                !== undefined) updates.name                = body.name.trim();
    if (body.quantity            !== undefined) updates.quantity            = parseFloat(body.quantity);
    if (body.unit                !== undefined) updates.unit                = body.unit.trim();
    if (body.low_stock_threshold !== undefined) updates.low_stock_threshold = parseFloat(body.low_stock_threshold);
    if (body.cost_price          !== undefined) updates.cost_price          = body.cost_price != null ? parseFloat(body.cost_price) : null;

    const { data, error } = await supabase
      .from("inventory_items")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("PATCH /api/inventory/[id]", err);
    return NextResponse.json({ success: false, error: "Failed to update item" }, { status: 500 });
  }
}

// DELETE /api/inventory/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/inventory/[id]", err);
    return NextResponse.json({ success: false, error: "Failed to delete item" }, { status: 500 });
  }
}
