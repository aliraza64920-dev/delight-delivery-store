// Payment gateway abstraction. Checkout only talks to this interface, so the
// gateway (Safepay, PayFast, JazzCash, ...) can be swapped without touching UI.
// Card data NEVER passes through this app — customers pay on the provider's
// hosted checkout page.

export type CreateSessionInput = {
  orderNumber: string;
  amount: number; // PKR, whole rupees
  customerEmail: string;
  customerPhone: string;
  successUrl: string;
  cancelUrl: string;
};

export type WebhookResult =
  | { orderNumber: string; outcome: "paid" | "failed" | "cancelled"; reference: string }
  | null;

export interface PaymentProvider {
  id: string;
  label: string;
  createSession(input: CreateSessionInput): Promise<{ redirectUrl: string; reference: string }>;
  /** Verifies the provider signature. Returns null when the payload is not trusted. */
  verifyWebhook(request: Request): Promise<WebhookResult>;
}

export async function getPaymentProvider(): Promise<PaymentProvider | null> {
  const which = (process.env["PAYMENT_PROVIDER"] ?? "safepay").toLowerCase();
  if (which === "safepay") {
    const { createSafepayProvider } = await import("./safepay.server");
    return createSafepayProvider();
  }
  return null;
}
