import { createHmac, timingSafeEqual } from "crypto";
import type { PaymentProvider } from "./provider.server";

// Safepay (Pakistan) hosted checkout adapter.
// Required secrets: SAFEPAY_API_KEY, SAFEPAY_SECRET_KEY, SAFEPAY_WEBHOOK_SECRET
// Optional: SAFEPAY_ENV = "sandbox" | "production" (default sandbox)
// Verify endpoint shapes against the merchant's Safepay dashboard docs when
// credentials are issued.
export function createSafepayProvider(): PaymentProvider | null {
  const apiKey = process.env["SAFEPAY_API_KEY"];
  const secret = process.env["SAFEPAY_SECRET_KEY"];
  const webhookSecret = process.env["SAFEPAY_WEBHOOK_SECRET"];
  if (!apiKey || !secret || !webhookSecret) return null;

  const env = process.env["SAFEPAY_ENV"] === "production" ? "production" : "sandbox";
  const apiBase = env === "production" ? "https://api.getsafepay.com" : "https://sandbox.api.getsafepay.com";
  const checkoutBase = env === "production" ? "https://getsafepay.com" : "https://sandbox.api.getsafepay.com";

  return {
    id: "safepay",
    label: "Safepay",
    async createSession(input) {
      const res = await fetch(`${apiBase}/order/v1/init`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ client: apiKey, amount: input.amount, currency: "PKR", environment: env }),
      });
      if (!res.ok) {
        console.error("Safepay init failed", res.status, await res.text());
        throw new Error("PAYMENT_INIT_FAILED");
      }
      const json = (await res.json()) as { data?: { token?: string } };
      const tracker = json.data?.token;
      if (!tracker) throw new Error("PAYMENT_INIT_FAILED");
      const params = new URLSearchParams({
        env,
        beacon: tracker,
        source: "custom",
        order_id: input.orderNumber,
        redirect_url: input.successUrl,
        cancel_url: input.cancelUrl,
      });
      return { redirectUrl: `${checkoutBase}/components?${params}`, reference: tracker };
    },
    async verifyWebhook(request) {
      const raw = await request.text();
      const sig = request.headers.get("x-sfpy-signature") ?? "";
      const expected = createHmac("sha512", webhookSecret).update(raw).digest("hex");
      const a = Buffer.from(sig);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
      const payload = JSON.parse(raw) as {
        data?: { tracker?: string; state?: string; metadata?: { order_id?: string }; order_id?: string };
      };
      const d = payload.data ?? {};
      const orderNumber = d.metadata?.order_id ?? d.order_id;
      if (!orderNumber || !d.tracker) return null;
      const state = (d.state ?? "").toUpperCase();
      const outcome = state === "PAID" || state === "TRACKER_ENDED" ? "paid" : state.includes("CANCEL") ? "cancelled" : "failed";
      return { orderNumber, outcome, reference: d.tracker };
    },
  };
}
