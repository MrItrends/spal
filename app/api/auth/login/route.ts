import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Capture session cookies written by signInWithPassword
    const capturedCookies: Array<{
      name: string;
      value: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options: any;
    }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll:  () => req.cookies.getAll(),
          setAll:  (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              capturedCookies.push({ name, value, options });
            });
          },
        },
      }
    );

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    });

    if (signInError || !authData.user) {
      console.error("[login] signInWithPassword error:", signInError?.message);
      return NextResponse.json(
        { success: false, error: "Incorrect email or password." },
        { status: 401 }
      );
    }

    // Fetch the user profile from our users table
    const admin = createAdminClient();
    const { data: userProfile } = await admin
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .maybeSingle();

    // Build response and attach session cookies
    const response = NextResponse.json({ success: true, data: { user: userProfile } });
    capturedCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
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
