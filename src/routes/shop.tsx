import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { productsQuery } from "@/lib/queries";
import { AGES, CATEGORIES, effectivePrice, type Product } from "@/lib/format";
import { ProductCard } from "@/components/store/ProductCard";

type Search = {
  q?: string; category?: string; age?: string; brand?: string; min?: number; max?: number;
  avail?: "in" | "out"; rating?: number; sort?: "popular" | "newest" | "price_asc" | "price_desc"; sale?: boolean;
};

const num = (v: unknown) => (v === undefined || v === "" || isNaN(Number(v)) ? undefined : Number(v));
const str = (v: unknown) => (typeof v === "string" && v ? v.slice(0, 100) : undefined);

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: str(s.q), category: str(s.category), age: str(s.age), brand: str(s.brand),
    min: num(s.min), max: num(s.max),
    avail: s.avail === "in" || s.avail === "out" ? s.avail : undefined,
    rating: num(s.rating),
    sort: ["popular", "newest", "price_asc", "price_desc"].includes(s.sort as string) ? (s.sort as Search["sort"]) : undefined,
    sale: s.sale === true || s.sale === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop All Toys — Play Town" },
      { name: "description", content: "Browse and filter toys by category, age, price, brand and rating. COD available across Pakistan." },
      { property: "og:title", content: "Shop All Toys — Play Town" },
      { property: "og:description", content: "Find the perfect toy with smart filters and search." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery()),
  component: Shop,
});

function matches(p: Product, q: string) {
  const hay = [p.name, p.category, p.subcategory, p.brand, p.sku, ...p.keywords].join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

function Shop() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: products } = useSuspenseQuery(productsQuery());
  const [showFilters, setShowFilters] = useState(false);
  const set = (patch: Partial<Search>) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const categories = useMemo(
    () => [...new Set([...CATEGORIES.map((category) => category.name), ...products.map((product) => product.category)])],
    [products],
  );
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort(), [products]);

  const list = useMemo(() => {
    let r = products.filter((p) => {
      const price = effectivePrice(p);
      if (s.q && !matches(p, s.q)) return false;
      if (s.category && p.category !== s.category) return false;
      if (s.age && p.age_range !== s.age) return false;
      if (s.brand && p.brand !== s.brand) return false;
      if (s.min != null && price < s.min) return false;
      if (s.max != null && price > s.max) return false;
      if (s.avail === "in" && p.stock_quantity <= 0) return false;
      if (s.avail === "out" && p.stock_quantity > 0) return false;
      if (s.rating != null && Number(p.rating) < s.rating) return false;
      if (s.sale && !(p.sale_price != null && p.sale_price < p.price)) return false;
      return true;
    });
    const sort = s.sort ?? "popular";
    r = [...r].sort((a, b) =>
      sort === "newest" ? +new Date(b.created_at) - +new Date(a.created_at) || Number(b.is_new) - Number(a.is_new)
      : sort === "price_asc" ? effectivePrice(a) - effectivePrice(b)
      : sort === "price_desc" ? effectivePrice(b) - effectivePrice(a)
      : b.popularity - a.popularity,
    );
    return r;
  }, [products, s]);

  const active = Object.entries(s).filter(([k, v]) => v !== undefined && k !== "sort");

  return (
    <div className="section">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl">{s.q ? `Results for “${s.q}”` : s.category ?? (s.sale ? "On Sale" : "All Toys")}</h1>
          <p className="text-muted-foreground">{list.length} product{list.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters((v) => !v)} className="pill-btn pill-secondary lg:hidden"><SlidersHorizontal className="h-4 w-4" />Filters</button>
          <select aria-label="Sort" value={s.sort ?? "popular"} onChange={(e) => set({ sort: e.target.value as Search["sort"] })} className="field w-auto">
            <option value="popular">Popular</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get("q"); set({ q: (v as string).trim() || undefined }); }} className="mb-5 flex gap-2">
        <input name="q" defaultValue={s.q} key={s.q} placeholder="Search by name, brand, category, keyword or SKU" className="field" aria-label="Search" />
        <button className="pill-btn pill-primary">Search</button>
      </form>

      {active.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {active.map(([k, v]) => (
            <button key={k} onClick={() => set({ [k]: undefined })} className="rounded-full bg-lilac px-3 py-1.5 text-sm font-semibold">{k}: {String(v)} ✕</button>
          ))}
          <Link to="/shop" className="rounded-full px-3 py-1.5 text-sm font-bold underline">Clear all</Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className={`${showFilters ? "block" : "hidden"} soft-card h-fit space-y-5 p-5 lg:block`}>
          <Filter label="Category">
            <select className="field" value={s.category ?? ""} onChange={(e) => set({ category: e.target.value || undefined })}>
              <option value="">All categories</option>{categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Filter>
          <Filter label="Age">
            <select className="field" value={s.age ?? ""} onChange={(e) => set({ age: e.target.value || undefined })}>
              <option value="">All ages</option>{AGES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </Filter>
          <Filter label="Price (Rs.)">
            <div className="flex gap-2">
              <input type="number" min={0} placeholder="Min" className="field" defaultValue={s.min} key={`min${s.min}`} onBlur={(e) => set({ min: num(e.target.value) })} />
              <input type="number" min={0} placeholder="Max" className="field" defaultValue={s.max} key={`max${s.max}`} onBlur={(e) => set({ max: num(e.target.value) })} />
            </div>
          </Filter>
          <Filter label="Brand">
            <select className="field" value={s.brand ?? ""} onChange={(e) => set({ brand: e.target.value || undefined })}>
              <option value="">All brands</option>{brands.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Filter>
          <Filter label="Availability">
            <select className="field" value={s.avail ?? ""} onChange={(e) => set({ avail: (e.target.value || undefined) as Search["avail"] })}>
              <option value="">Any</option><option value="in">In stock</option><option value="out">Out of stock</option>
            </select>
          </Filter>
          <Filter label="Rating">
            <select className="field" value={s.rating ?? ""} onChange={(e) => set({ rating: num(e.target.value) })}>
              <option value="">Any rating</option><option value="4.5">4.5★ & up</option><option value="4">4★ & up</option>
            </select>
          </Filter>
        </aside>

        {list.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        ) : (
          <div className="soft-card flex flex-col items-center p-12 text-center">
            <div className="text-6xl">🔍</div>
            <h2 className="mt-3 text-2xl">No toys match that</h2>
            <p className="mt-1 text-muted-foreground">Try a different search or clear some filters.</p>
            <Link to="/shop" className="pill-btn pill-primary mt-5">Clear filters</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="mb-1.5 text-sm font-bold">{label}</div>{children}</div>;
}
