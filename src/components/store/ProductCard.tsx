import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";
import { addToCart, toggleWishlist, useWishlist } from "@/lib/cart";
import { discountPct, effectivePrice, formatRs, stockStatus, type Product } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ProductVisual } from "./ProductVisual";

export function ProductCard({ p }: { p: Product }) {
  const wish = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const inWish = wish.includes(p.id);
  const pct = discountPct(p);
  const stock = stockStatus(p);
  const out = stock.key === "out";

  return (
    <article className="soft-card flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
      <div className="relative">
        <Link to="/products/$slug" params={{ slug: p.slug }} aria-label={`View ${p.name}`}>
          <ProductVisual image={p.images[0]} emoji={p.emoji} color={p.color} name={p.name} />
        </Link>
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
          {pct > 0 && <span className="rounded-full bg-hotpink px-2.5 py-1 text-[0.68rem] font-extrabold text-primary-foreground">-{pct}% SALE</span>}
          {p.is_new && <span className="rounded-full bg-primary px-2.5 py-1 text-[0.68rem] font-extrabold text-primary-foreground">NEW</span>}
          {p.is_best_seller && <span className="rounded-full bg-card px-2.5 py-1 text-[0.68rem] font-extrabold">BEST SELLER</span>}
        </div>
        <button
          aria-label={inWish ? "Remove from wishlist" : "Add to wishlist"}
          onClick={async () => {
            const added = await toggleWishlist(p.id, user?.id ?? null);
            toast(added ? "Added to wishlist" : "Removed from wishlist");
          }}
          className="absolute right-2.5 top-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft transition hover:scale-110"
        >
          <Heart className={cn("h-5 w-5", inWish && "fill-hotpink text-hotpink")} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <Link to="/products/$slug" params={{ slug: p.slug }} className="text-[0.94rem] font-bold hover:underline">{p.name}</Link>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {p.review_count > 0 && <><Star className="h-3.5 w-3.5 fill-butter-d text-butter-d" /> {Number(p.rating).toFixed(1)} ({p.review_count})</>}
          <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[0.65rem] font-bold", stock.cls)}>{stock.key === "low" ? "Low Stock" : stock.label}</span>
        </div>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="font-extrabold">{formatRs(effectivePrice(p))}</span>
          {pct > 0 && <span className="text-xs text-muted-foreground line-through">{formatRs(p.price)}</span>}
        </div>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <button
            disabled={out}
            onClick={() => {
              const r = addToCart(p);
              r.ok ? toast.success(r.message) : toast.error(r.message);
            }}
            className="min-h-10 rounded-full border-2 border-primary text-xs font-bold disabled:opacity-40"
          >
            Add to Cart
          </button>
          <button
            disabled={out}
            onClick={() => {
              addToCart(p);
              navigate({ to: "/checkout" });
            }}
            className="min-h-10 rounded-full bg-primary text-xs font-bold text-primary-foreground disabled:opacity-40"
          >
            {out ? "Sold Out" : "Buy Now"}
          </button>
        </div>
      </div>
    </article>
  );
}
