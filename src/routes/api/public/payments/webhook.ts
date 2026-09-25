import { createFileRoute } from "@tanstack/react-router";
import { getPaymentProvider } from "@/lib/payments/provider.server";
import { finalizeCardPayment } from "@/lib/orders.server";

// Payment gateway calls this URL after a payment attempt. The signature is
// verified by the provider adapter before any order is touched.
export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provider = await getPaymentProvider();
        if (!provider) return new Response("Payment gateway not configured", { status: 503 });
        const result = await provider.verifyWebhook(request);
        if (!result) return new Response("Invalid signature", { status: 401 });
        await finalizeCardPayment(result.orderNumber, result.outcome, result.reference);
        return new Response("ok");
      },
    },
  },
});
