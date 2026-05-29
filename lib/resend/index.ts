/**
 * Resend Email — https://resend.com
 *
 * We call Resend's REST API directly (no SMTP, no SDK dependency).
 * This mirrors the Termii pattern: no API key → dev mode (logs to console).
 */

const RESEND_API_URL = "https://api.resend.com/emails";

export interface SendResult {
  success: boolean;
  error?: string;
}

export async function sendOTPviaEmail(
  email: string,
  otp:   string
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;

  // ── DEV MODE: no API key — just log to console ────────────────────────────
  if (!apiKey) {
    console.log("\n────────────────────────────────────────");
    console.log(`  [SPAL DEV] OTP for ${email}: ${otp}`);
    console.log("────────────────────────────────────────\n");
    return { success: true };
  }

  // ── PROD MODE: Resend REST API ─────────────────────────────────────────────
  let res: Response;
  let rawText = "";

  try {
    res = await fetch(RESEND_API_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from:    "SPAL <onboarding@resend.dev>",
        to:      email,
        subject: `${otp} is your SPAL code`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;background:#fff;">
            <h2 style="margin:0 0 8px;color:#0F172A;font-size:22px;">Your SPAL verification code</h2>
            <p style="margin:0 0 28px;color:#475569;font-size:14px;line-height:1.6;">
              Enter this code to continue setting up your business account. It expires in 10 minutes.
            </p>
            <div style="background:#F8F7F4;border-radius:14px;padding:28px;text-align:center;margin-bottom:28px;">
              <span style="font-size:44px;font-weight:700;letter-spacing:10px;color:#0F172A;">${otp}</span>
            </div>
            <p style="margin:0;color:#94A3B8;font-size:12px;">
              If you didn&rsquo;t request this, you can safely ignore this email.
              Never share this code with anyone.
            </p>
          </div>
        `,
      }),
    });

    rawText = await res.text();
  } catch (networkErr) {
    console.error("[Resend] Network error:", networkErr);
    return {
      success: false,
      error: "Email service unreachable. Please try again in a moment.",
    };
  }

  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(rawText);
  } catch {
    console.error("[Resend] Non-JSON response:", rawText.slice(0, 300));
    return {
      success: false,
      error: "Email service returned an unexpected response. Please try again.",
    };
  }

  if (!res.ok) {
    console.error("[Resend] HTTP", res.status, data);
    const msg = typeof data.message === "string"
      ? data.message
      : `Email delivery failed (${res.status}).`;
    return { success: false, error: msg };
  }

  console.log("[Resend] Sent to", email, "id:", data.id);
  return { success: true };
}
