import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, Minus, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { configQuery, productQuery } from "@/lib/queries";
import { addToCart, toggleWishlist, useWishlist } from "@/lib/cart";
import { discountPct, effectivePrice, formatRs, stockStatus, waLink } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { ProductVisual } from "@/components/store/ProductVisual";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/store/WhatsAppIcon";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) throw notFound();
    return { name: p.name, description: p.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Toy not found — Play Town" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.name} — Play Town`;
    return { meta: [{ title: t }, { name: "description", content: loaderData.description || `${loaderData.name} — Intex, available at Play Town.` }, { property: "og:title", content: t }, { property: "og:description", content: loaderData.description || `${loaderData.name} — Intex, available at Play Town.` }] };
  },
  notFoundComponent: () => (
    <div className="section text-center"><div className="text-6xl">🧸</div><h1 className="mt-2 text-3xl">Toy not found</h1><Link to="/shop" className="pill-btn pill-primary mt-5">Back to shop</Link></div>
  ),
  errorComponent: () => <div className="section text-center">Couldn't load this toy. <Link to="/shop" className="underline">Back to shop</Link></div>,
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQuery(slug));
  const { data: cfg } = useQuery(configQuery());
  const { user } = useAuth();
  const wish = useWishlist();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  if (!p) return null;
  const stock = stockStatus(p);
  const out = stock.key === "out";
  const pct = discountPct(p);
  const inWish = wish.includes(p.id);

  const add = () => {
    const r = addToCart(p, qty);
    r.ok ? toast.success(r.message) : toast.error(r.message);
    return r.ok;
  };

  return (
    <div className="section">
      <nav className="mb-4 text-sm text-muted-foreground"><Link to="/shop" className="hover:underline">Shop</Link> / <Link to="/shop" search={{ category: p.category }} className="hover:underline">{p.category}</Link> / {p.name}</nav>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="soft-card overflow-hidden"><ProductVisual image={p.images[img]} emoji={p.emoji} color={p.color} name={p.name} size="text-[8rem]" /></div>
          {p.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {p.images.map((src, i) => (
                <button key={src} onClick={() => setImg(i)} className={cn("h-16 w-16 overflow-hidden rounded-xl border-2", i === img ? "border-primary" : "border-transparent")}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            {pct > 0 && <span className="rounded-full bg-hotpink px-3 py-1 text-xs font-extrabold text-primary-foreground">-{pct}% SALE</span>}
            {p.is_new && <span className="rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-primary-foreground">NEW</span>}
            {p.is_best_seller && <span className="rounded-full bg-butter px-3 py-1 text-xs font-extrabold">BEST SELLER</span>}
          </div>
          <h1 className="mt-3 text-4xl">{p.name}</h1>
          {p.review_count > 0 && <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground"><Star className="h-4 w-4 fill-butter-d text-butter-d" /> {Number(p.rating).toFixed(1)} · {p.review_count} reviews</div>}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold">{formatRs(effectivePrice(p))}</span>
            {pct > 0 && <span className="text-lg text-muted-foreground line-through">{formatRs(p.price)}</span>}
          </div>
          <span className={cn("mt-3 inline-block rounded-full px-3 py-1 text-sm font-bold", stock.cls)}>{stock.label}</span>
          {p.description && <p className="mt-4 text-muted-foreground">{p.description}</p>}
          <dl className="mt-4 grid grid-cols-2 gap-y-1 text-sm">
            <dt className="font-bold">Brand</dt><dd>{p.brand}</dd>
            {p.age_range && <><dt className="font-bold">Age</dt><dd>{p.age_range === "Teens" ? "13+" : p.age_range} years</dd></>}
            <dt className="font-bold">SKU</dt><dd>{p.sku}</dd>
            <dt className="font-bold">Category</dt><dd>{p.category}{p.subcategory ? ` · ${p.subcategory}` : ""}</dd>
          </dl>

          {!out && (
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm font-bold">Qty</span>
              <div className="flex items-center rounded-full border-2 border-primary">
                <button aria-label="Decrease" className="flex h-11 w-11 items-center justify-center" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></button>
                <span className="w-8 text-center font-bold">{qty}</span>
                <button aria-label="Increase" className="flex h-11 w-11 items-center justify-center disabled:opacity-30" disabled={qty >= p.stock_quantity} onClick={() => setQty((q) => Math.min(p.stock_quantity, q + 1))}><Plus className="h-4 w-4" /></button>
              </div>
            </div>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button disabled={out} onClick={add} className="pill-btn pill-secondary">Add to Cart</button>
            <button disabled={out} onClick={() => { if (add()) navigate({ to: "/checkout" }); }} className="pill-btn pill-primary">{out ? "Out of Stock" : "Buy Now"}</button>
            <button onClick={async () => toast(await toggleWishlist(p.id, user?.id ?? null) ? "Added to wishlist" : "Removed from wishlist")} className="pill-btn border-2 border-border bg-card">
              <Heart className={cn("h-4 w-4", inWish && "fill-hotpink text-hotpink")} /> {inWish ? "In Wishlist" : "Add to Wishlist"}
            </button>
            <a href={waLink(cfg?.whatsapp ?? "923002552414", `Hi Play Town! I'd like to ask about "${p.name}" (SKU ${p.sku}).`)} target="_blank" rel="noopener noreferrer" className="pill-btn bg-whatsapp text-primary-foreground"><WhatsAppIcon className="h-5 w-5" /> Ask on WhatsApp</a>
          </div>

          {Object.keys(p.specifications).length > 0 && (
            <div className="soft-card mt-8 p-5">
              <h2 className="mb-2 text-xl">Specifications</h2>
              <dl className="grid grid-cols-2 gap-y-1 text-sm">{Object.entries(p.specifications).map(([k, v]) => <><dt key={k} className="font-bold">{k}</dt><dd key={`${k}v`}>{String(v)}</dd></>)}</dl>
            </div>
          )}
          {p.whats_included.length > 0 && (
            <div className="soft-card mt-4 p-5">
              <h2 className="mb-2 text-xl">What's included</h2>
              <ul className="list-inside list-disc text-sm">{p.whats_included.map((w) => <li key={w}>{w}</li>)}</ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
