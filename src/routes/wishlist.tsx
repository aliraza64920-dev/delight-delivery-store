import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useWishlist } from "@/lib/cart";
import { productsQuery } from "@/lib/queries";
import { ProductCard } from "@/components/store/ProductCard";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Your Wishlist — Play Town" },
      { name: "description", content: "Toys you have saved for later at Play Town." },
      { property: "og:title", content: "Your Wishlist — Play Town" },
      { property: "og:description", content: "Toys you have saved for later at Play Town." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const wish = useWishlist();
  const { data, isLoading } = useQuery(productsQuery());
  const items = (data ?? []).filter((p) => wish.includes(p.id));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Your Wishlist ({wish.length})</h1>
      {isLoading ? (
        <p className="mt-6 text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-6xl">💝</div>
          <p className="mt-4 text-muted-foreground">No saved toys yet — tap the heart on any toy to save it here.</p>
          <Link to="/shop" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground">Browse toys</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </main>
  );
}
