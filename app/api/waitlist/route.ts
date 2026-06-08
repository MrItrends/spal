import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email: string = (body.email ?? "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  try {
    // Add to Resend Audience
    await resend.contacts.create({
      email,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
      unsubscribed: false,
    });

    // Send confirmation email
    await resend.emails.send({
      from: "SPAL <hello@spal.ng>",
      to: email,
      subject: "You're on the SPAL waitlist 🎉",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're in!</title>
</head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:'Inter Tight',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:#123332;padding:40px 40px 32px;text-align:center;">
              <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;">SPAL</p>
              <p style="margin:8px 0 0;color:#22C55E;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;">Spending · Profiting · Analysing · Looping</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0F172A;line-height:1.3;">You're on the list!</p>
              <p style="margin:0 0 24px;font-size:16px;color:#67738F;line-height:1.6;">
                Hi there — you're officially on the SPAL waitlist. We're building the business companion that actually speaks your language, and we can't wait to share it with you.
              </p>
              <p style="margin:0 0 24px;font-size:16px;color:#67738F;line-height:1.6;">
                While you wait, here's what SPAL will help you do:
              </p>
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #F4F4F5;">
                    <span style="display:inline-block;width:28px;height:28px;background:#EFFBF4;border-radius:8px;text-align:center;line-height:28px;font-size:14px;margin-right:12px;vertical-align:middle;">💚</span>
                    <strong style="color:#0F172A;">Spending</strong> — log every expense fast
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #F4F4F5;">
                    <span style="display:inline-block;width:28px;height:28px;background:#FFF5EF;border-radius:8px;text-align:center;line-height:28px;font-size:14px;margin-right:12px;vertical-align:middle;">🟠</span>
                    <strong style="color:#0F172A;">Profiting</strong> — see exactly what you earn
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #F4F4F5;">
                    <span style="display:inline-block;width:28px;height:28px;background:#EAFBFA;border-radius:8px;text-align:center;line-height:28px;font-size:14px;margin-right:12px;vertical-align:middle;">📊</span>
                    <strong style="color:#0F172A;">Analysing</strong> — understand your numbers simply
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <span style="display:inline-block;width:28px;height:28px;background:#F7F3FE;border-radius:8px;text-align:center;line-height:28px;font-size:14px;margin-right:12px;vertical-align:middle;">🔁</span>
                    <strong style="color:#0F172A;">Looping</strong> — keep improving every day
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:14px;color:#A1A1AA;">We'll reach out as soon as your spot is ready.</p>
              <p style="margin:0;font-size:14px;color:#A1A1AA;">— The SPAL team</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F8F7F4;padding:24px 40px;text-align:center;border-top:1px solid #F4F4F5;">
              <p style="margin:0;font-size:12px;color:#A1A1AA;">© 2025 SPAL · <a href="https://spal.ng" style="color:#22C55E;text-decoration:none;">spal.ng</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    console.error("[waitlist]", message);
    return NextResponse.json({ error: "Could not add you to the waitlist. Please try again." }, { status: 500 });
  }
}
