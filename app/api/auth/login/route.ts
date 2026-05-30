import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/auth/login
// Accepts: { contact: "email@example.com" | "+2348012345678", password }
// Falls back to cross-reference if user registered with the other method
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Support both { email, password } (legacy) and { contact, password }
    const contact  = (body.contact ?? body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!contact || !password) {
      return NextResponse.json(
        { success: false, error: "Email/phone and password are required." },
        { status: 400 }
      );
    }

    const capturedCookies: Array<{ name: string; value: string; options: unknown }> = [];
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              capturedCookies.push({ name, value, options });
            });
          },
        },
      }
    );

    const admin = createAdminClient();
    const isPhone = /^\+?\d{7,15}$/.test(contact.replace(/[\s\-().]/g, ""));

    // Normalise phone to E.164 format
    const normalised = isPhone
      ? (contact.startsWith("+") ? contact : `+${contact}`).replace(/[\s\-().]/g, "")
      : contact;

    let authResult = null;
    let authError  = null;

    if (isPhone) {
      // 1. Try phone auth directly (user registered via phone)
      const r = await supabase.auth.signInWithPassword({ phone: normalised, password });
      authResult = r.data;
      authError  = r.error;

      if (authError) {
        // 2. Phone not in Supabase auth — maybe they registered via email and added phone later
        const { data: profile } = await admin
          .from("users")
          .select("email")
          .eq("phone_number", normalised)
          .maybeSingle();

        if (profile?.email) {
          const r2 = await supabase.auth.signInWithPassword({ email: profile.email, password });
          authResult = r2.data;
          authError  = r2.error;
        }
      }
    } else {
      // 1. Try email auth directly (user registered via email)
      const r = await supabase.auth.signInWithPassword({ email: normalised, password });
      authResult = r.data;
      authError  = r.error;

      if (authError) {
        // 2. Email not in Supabase auth — maybe they registered via phone and added email later
        const { data: profile } = await admin
          .from("users")
          .select("id")
          .eq("email", normalised)
          .maybeSingle();

        if (profile?.id) {
          // Find their Supabase auth phone from auth.users
          const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
          if (authUser?.user?.phone) {
            const r2 = await supabase.auth.signInWithPassword({
              phone:    authUser.user.phone,
              password,
            });
            authResult = r2.data;
            authError  = r2.error;
          }
        }
      }
    }

    if (authError || !authResult?.user) {
      return NextResponse.json(
        { success: false, error: "Incorrect email, phone number, or password." },
        { status: 401 }
      );
    }

    // Fetch user profile
    const { data: userProfile } = await admin
      .from("users")
      .select("*")
      .eq("id", authResult.user.id)
      .maybeSingle();

    const response = NextResponse.json({ success: true, data: { user: userProfile } });
    capturedCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
    });

    return response;
  } catch (err) {
    console.error("[login] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
