import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { trackOrder } from "@/lib/store.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Your Order — Play Town" },
      { name: "description", content: "Check the delivery status of your Play Town order." },
      { property: "og:title", content: "Track Your Order — Play Town" },
      { property: "og:description", content: "Check the delivery status of your Play Town order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const STEPS = [
  ["placed", "Order Placed"],
  ["confirmed", "Confirmed"],
  ["processing", "Processing"],
  ["packed", "Packed"],
  ["shipped", "Shipped"],
  ["out_for_delivery", "Out for Delivery"],
  ["delivered", "Delivered"],
] as const;

type Result = Awaited<ReturnType<typeof trackOrder>>;

function Page() {
  const track = useServerFn(trackOrder);
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState<Result>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setRes(null);
    if (orderNumber.trim().length < 4 || phone.trim().length < 7) {
      setError("Please enter your order number and phone number.");
      return;
    }
    setLoading(true);
    try {
      const r = await track({ data: { orderNumber: orderNumber.trim(), phone: phone.trim() } });
      if (!r) setError("No order found. Please check the order number and phone number.");
      setRes(r);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const status = res?.order.status;
  const idx = STEPS.findIndex(([s]) => s === status);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">Track Your Order</h1>
      <p className="mt-2 text-muted-foreground">Enter the order number and phone number used at checkout.</p>
      <form onSubmit={submit} className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Input placeholder="Order number (e.g. PT-12345)" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
        <Input placeholder="Phone (03xx xxxxxxx)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Button type="submit" disabled={loading}>{loading ? "Checking..." : "Track"}</Button>
      </form>
      {error && <p className="mt-4 text-destructive">{error}</p>}

      {res && (
        <section className="mt-8 rounded-xl border bg-card p-6">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <p className="text-sm text-muted-foreground">Order</p>
              <p className="text-xl font-bold">{res.order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-bold">Rs {Number(res.order.total).toLocaleString()}</p>
            </div>
          </div>

          {status === "cancelled" ? (
            <p className="mt-6 font-semibold text-destructive">This order was cancelled.</p>
          ) : status === "pending_payment" ? (
            <p className="mt-6 font-semibold">Waiting for payment.</p>
          ) : (
            <ol className="mt-6 space-y-3">
              {STEPS.map(([s, label], i) => {
                const done = i <= idx;
                return (
                  <li key={s} className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${done ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground"}`}>
                      {done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className={done ? "font-semibold" : "text-muted-foreground"}>{label}</span>
                  </li>
                );
              })}
            </ol>
          )}

          {res.items.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <p className="mb-2 font-semibold">Items</p>
              <ul className="space-y-1 text-sm">
                {res.items.map((it, i) => (
                  <li key={i} className="flex justify-between"><span>{it.product_name} × {it.quantity}</span><span>Rs {Number(it.line_total).toLocaleString()}</span></li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
      <Link to="/shop" className="mt-8 inline-block underline">Keep shopping</Link>
    </main>
  );
}
