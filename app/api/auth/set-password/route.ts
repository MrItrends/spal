import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/auth/set-password
// Requires an active session (called right after OTP verify).
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // Read the current user from the session cookie set by verify-otp
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: () => {}, // no new cookies needed here
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated. Please sign in again." },
        { status: 401 }
      );
    }

    // Update the user's password via the admin client
    const admin = createAdminClient();
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password,
    });

    if (updateError) {
      console.error("[set-password] updateUserById error:", updateError.message);
      return NextResponse.json(
        { success: false, error: "Could not set password. Please try again." },
        { status: 500 }
      );
    }

    // Mark onboarding complete — locks the account so the same email/phone
    // can't be used to sign up again (only sign in from now on).
    await admin
      .from("users")
      .update({ onboarding_completed: true })
      .eq("id", user.id);

    console.log("[set-password] Password set + onboarding completed for user:", user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[set-password] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
