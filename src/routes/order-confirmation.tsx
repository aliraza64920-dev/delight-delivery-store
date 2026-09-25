import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { getOrderByToken } from "@/lib/store.functions";
import { clearCart } from "@/lib/cart";
import { formatRs, PAYMENT_LABEL, STATUS_LABEL } from "@/lib/format";

export const Route = createFileRoute("/order-confirmation")({
  validateSearch: (s: Record<string, unknown>) => ({ order: String(s.order ?? ""), t: String(s.t ?? "") }),
  head: () => ({
    meta: [
      { title: "Order Confirmed — Play Town" },
      { name: "description", content: "Thank you for shopping at Play Town. Here are your order details." },
      { property: "og:title", content: "Order Confirmed — Play Town" },
      { property: "og:description", content: "Thank you for shopping at Play Town." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const { order, t } = Route.useSearch();
  const valid = !!order && /^[0-9a-f-]{36}$/i.test(t);
  const { data, isLoading } = useQuery({
    queryKey: ["order", order, t],
    queryFn: () => getOrderByToken({ data: { orderNumber: order, token: t } }),
    enabled: valid,
    refetchInterval: (q) => (q.state.data?.order.payment_status === "awaiting_payment" ? 4000 : false),
  });

  useEffect(() => {
    if (data?.order.payment_status === "paid") clearCart();
  }, [data?.order.payment_status]);

  if (valid && isLoading) return <main className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>;
  if (!data)
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Order not found</h1>
        <p className="mt-2 text-muted-foreground">Use your order number and phone to track it instead.</p>
        <Link to="/track" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground">Track order</Link>
      </main>
    );

  const o = data.order;
  const pending = o.payment_status === "awaiting_payment";
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        {pending ? <Clock className="mx-auto h-14 w-14 text-warning" /> : <CheckCircle2 className="mx-auto h-14 w-14 text-success" />}
        <h1 className="mt-3 font-display text-3xl font-bold">{pending ? "Confirming your payment…" : "Thank you! Your order is placed."}</h1>
        <p className="mt-2 text-muted-foreground">Order <b className="text-foreground">{o.order_number}</b> · confirmation sent to {o.email}</p>
      </div>
      <div className="mt-8 space-y-4 rounded-2xl border bg-card p-5 text-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><h2 className="font-bold">Delivering to</h2><p>{o.customer_name}</p><p>{o.address}, {o.city}</p><p>{o.phone}</p></div>
          <div><h2 className="font-bold">Payment</h2><p>{o.payment_method === "cod" ? "Cash on Delivery" : "Card"}</p><p className="text-muted-foreground">{PAYMENT_LABEL[o.payment_status] ?? o.payment_status}</p><p className="mt-1 text-muted-foreground">Status: {STATUS_LABEL[o.status] ?? o.status}</p></div>
        </div>
        <ul className="divide-y border-t">
          {data.items.map((i) => <li key={i.sku} className="flex justify-between py-2"><span>{i.product_name} × {i.quantity}</span><span>{formatRs(Number(i.line_total))}</span></li>)}
        </ul>
        <div className="space-y-1 border-t pt-3">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatRs(Number(o.subtotal))}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>{Number(o.delivery_fee) === 0 ? "Free" : formatRs(Number(o.delivery_fee))}</span></div>
          {Number(o.discount) > 0 && <div className="flex justify-between"><span>Discount</span><span>− {formatRs(Number(o.discount))}</span></div>}
          <div className="flex justify-between text-base font-bold"><span>{o.payment_method === "cod" ? "Pay on delivery" : "Total"}</span><span>{formatRs(Number(o.total))}</span></div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/track" className="rounded-full border px-6 py-3 font-semibold">Track order</Link>
        <Link to="/shop" className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground">Continue shopping</Link>
      </div>
    </main>
  );
}
