import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, setQty, removeFromCart } from "@/lib/cart";
import { formatRs } from "@/lib/format";
import { ProductVisual } from "@/components/store/ProductVisual";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Play Town" },
      { name: "description", content: "Review the toys in your Play Town cart." },
      { property: "og:title", content: "Your Cart — Play Town" },
      { property: "og:description", content: "Review the toys in your Play Town cart." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { items, count } = useCart();
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  if (!items.length)
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="text-6xl">🛒</div>
        <h1 className="mt-4 font-display text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Add some fun toys to get started.</p>
        <Link to="/shop" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground">Start shopping</Link>
      </main>
    );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Your Cart ({count})</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <ul className="space-y-4">
          {items.map((i) => (
            <li key={i.productId} className="flex gap-4 rounded-2xl border bg-card p-3">
              <Link to="/products/$slug" params={{ slug: i.slug }} className="w-24 shrink-0 overflow-hidden rounded-xl">
                <ProductVisual image={i.image} emoji={i.emoji} color={i.color} name={i.name} size="text-3xl" />
              </Link>
              <div className="flex flex-1 flex-col">
                <Link to="/products/$slug" params={{ slug: i.slug }} className="font-bold hover:underline">{i.name}</Link>
                <span className="text-sm text-muted-foreground">{formatRs(i.price)}</span>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border">
                    <button aria-label="Decrease" className="p-2" onClick={() => setQty(i.productId, i.quantity - 1)}><Minus className="h-4 w-4" /></button>
                    <span className="w-8 text-center font-bold">{i.quantity}</span>
                    <button aria-label="Increase" className="p-2 disabled:opacity-40" disabled={i.quantity >= i.stock} onClick={() => setQty(i.productId, i.quantity + 1)}><Plus className="h-4 w-4" /></button>
                  </div>
                  <span className="font-bold">{formatRs(i.price * i.quantity)}</span>
                  <button aria-label="Remove" className="p-2 text-destructive" onClick={() => removeFromCart(i.productId)}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit rounded-2xl border bg-card p-5">
          <h2 className="font-display text-xl font-bold">Order Summary</h2>
          <div className="mt-4 flex justify-between"><span>Subtotal</span><span className="font-bold">{formatRs(subtotal)}</span></div>
          <p className="mt-1 text-xs text-muted-foreground">Delivery charges calculated at checkout.</p>
          <Link to="/checkout" className="mt-5 block rounded-full bg-primary py-3 text-center font-bold text-primary-foreground">Proceed to Checkout</Link>
          <Link to="/shop" className="mt-3 block text-center text-sm underline">Continue shopping</Link>
        </aside>
      </div>
    </main>
  );
}
