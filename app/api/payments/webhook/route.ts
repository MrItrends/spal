import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") ?? "";

    // Verify Paystack signature
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      console.warn("Paystack webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const supabase = await createClient();

    switch (event.event) {
      case "charge.success": {
        const { customer, metadata, plan } = event.data;
        const userId = metadata?.user_id;
        const billingCycle = metadata?.billing_cycle ?? (plan ? "monthly" : null);

        if (!userId) break;

        // Calculate period end
        const now = new Date();
        const periodEnd = new Date(now);
        if (billingCycle === "yearly") {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            plan: "pro",
            billing_cycle: billingCycle,
            status: "active",
            paystack_customer_code: customer?.customer_code,
            paystack_subscription_code: event.data.subscription_code ?? null,
            current_period_end: periodEnd.toISOString(),
            updated_at: now.toISOString(),
          },
          { onConflict: "user_id" }
        );

        // Sync denormalised field
        await supabase
          .from("users")
          .update({ subscription_plan: "pro" })
          .eq("id", userId);

        console.log(`✅ Upgraded user ${userId} to Pro (${billingCycle})`);
        break;
      }

      case "subscription.disable": {
        const subscriptionCode = event.data.subscription_code;
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("paystack_subscription_code", subscriptionCode);
        break;
      }

      case "invoice.payment_failed": {
        const subscriptionCode = event.data.subscription?.subscription_code;
        if (subscriptionCode) {
          await supabase
            .from("subscriptions")
            .update({ status: "expired", updated_at: new Date().toISOString() })
            .eq("paystack_subscription_code", subscriptionCode);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("POST /api/payments/webhook", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
