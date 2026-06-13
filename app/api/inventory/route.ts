import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/inventory — returns items + user's inventory settings
export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const [{ data: items }, { data: profile }] = await Promise.all([
      supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("users")
        .select("inventory_setup_done, inventory_track_sales")
        .eq("id", user.id)
        .single(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: items ?? [],
        setupDone:   profile?.inventory_setup_done  ?? false,
        trackSales:  profile?.inventory_track_sales ?? false,
      },
    });
  } catch (err) {
    console.error("GET /api/inventory", err);
    return NextResponse.json({ success: false, error: "Failed to fetch inventory" }, { status: 500 });
  }
}

// POST /api/inventory — create a single item
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, quantity, unit, low_stock_threshold, cost_price } = body;

    if (!name || quantity === undefined || !unit) {
      return NextResponse.json({ success: false, error: "name, quantity and unit are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        user_id:             user.id,
        name:                name.trim(),
        quantity:            parseFloat(quantity),
        unit:                unit.trim(),
        low_stock_threshold: low_stock_threshold != null ? parseFloat(low_stock_threshold) : 5,
        cost_price:          cost_price != null ? parseFloat(cost_price) : null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/inventory", err);
    return NextResponse.json({ success: false, error: "Failed to create item" }, { status: 500 });
  }
}

// PUT /api/inventory — bulk setup (wizard completion): creates multiple items + marks setup done
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { items } = await req.json() as {
      items: { name: string; quantity: number; unit: string; low_stock_threshold?: number }[];
    };

    const admin = createAdminClient();

    // Insert all items
    if (items && items.length > 0) {
      const rows = items.map((it) => ({
        user_id:             user.id,
        name:                it.name.trim(),
        quantity:            it.quantity ?? 0,
        unit:                it.unit,
        low_stock_threshold: it.low_stock_threshold ?? 5,
      }));

      const { error } = await supabase.from("inventory_items").insert(rows);
      if (error) throw error;
    }

    // Mark setup as done
    await admin
      .from("users")
      .update({ inventory_setup_done: true })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT /api/inventory", err);
    return NextResponse.json({ success: false, error: "Failed to complete setup" }, { status: 500 });
  }
}

// PATCH /api/inventory — update inventory settings (track_sales, setup_done)
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const admin = createAdminClient();

    const updates: Record<string, unknown> = {};
    if (body.inventory_track_sales !== undefined) updates.inventory_track_sales = body.inventory_track_sales;
    if (body.inventory_setup_done  !== undefined) updates.inventory_setup_done  = body.inventory_setup_done;

    await admin.from("users").update(updates).eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/inventory (settings)", err);
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 });
  }
}
