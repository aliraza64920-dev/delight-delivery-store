import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listAdminProducts } from "@/lib/admin.functions";
import { CATEGORIES } from "@/lib/format";

export const Route = createFileRoute("/admin/products/")({
  head: () => ({ meta: [{ title: "Products — Play Town Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminProducts,
});

type Row = Awaited<ReturnType<typeof listAdminProducts>>[number];
type StockState = "in" | "low" | "out";

export function stockState(qty: number, threshold: number): StockState {
  if (qty <= 0) return "out";
  if (qty <= threshold) return "low";
  return "in";
}

const STOCK_LABEL: Record<StockState, string> = { in: "In Stock", low: "Low Stock", out: "Out of Stock" };
const STOCK_CLS: Record<StockState, string> = {
  in: "bg-success/15 text-success",
  low: "bg-warning/20 text-warning",
  out: "bg-destructive/15 text-destructive",
};
const rs = (n: number) => `Rs. ${Number(n).toLocaleString("en-PK")}`;
const field = "w-full rounded-lg border bg-background px-3 py-2 text-sm";

function AdminProducts() {
  const list = useServerFn(listAdminProducts);
  const { data = [], isLoading, error } = useQuery({ queryKey: ["admin-products"], queryFn: () => list() });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState("");

  const categories = useMemo(
    () => [...new Set([...CATEGORIES.map((c) => c.name), ...data.map((p) => p.category)])],
    [data],
  );
  const rows = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return data.filter((p) => {
      const hay = `${p.name} ${p.sku} ${p.category} ${p.subcategory ?? ""} ${p.brand}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
      if (cat && p.category !== cat && p.subcategory !== cat) return false;
      if (stock && stockState(p.stock_quantity, p.low_stock_threshold) !== stock) return false;
      if (status === "active" && !p.is_active) return false;
      if (status === "inactive" && p.is_active) return false;
      return true;
    });
  }, [data, q, cat, stock, status]);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-2xl font-bold">Products <span className="text-base text-muted-foreground">({rows.length}/{data.length})</span></h2>
      </div>
      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <input aria-label="Search products" placeholder="Search name, SKU, category…" value={q} onChange={(e) => setQ(e.target.value)} className={field} />
        <select aria-label="Category filter" value={cat} onChange={(e) => setCat(e.target.value)} className={field}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select aria-label="Stock filter" value={stock} onChange={(e) => setStock(e.target.value)} className={field}>
          <option value="">All stock</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
        <select aria-label="Status filter" value={status} onChange={(e) => setStatus(e.target.value)} className={field}>
          <option value="">Active + inactive</option>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
        </select>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading products…</p> : error ? <p className="text-destructive">Could not load products.</p> : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted text-left">
              <tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const s = stockState(p.stock_quantity, p.low_stock_threshold);
                return (
                  <tr key={p.id} className={`border-t ${p.is_active ? "" : "opacity-60"}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {p.images[0] ? <img src={p.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" loading="lazy" /> : <div className="h-12 w-12 rounded-lg bg-muted" />}
                        <div><div className="font-semibold">{p.name}</div><div className="text-xs text-muted-foreground">{p.sku} · {p.images.length} photo(s)</div></div>
                      </div>
                    </td>
                    <td className="p-3">{p.category}{p.subcategory && <div className="text-xs text-muted-foreground">{p.subcategory}</div>}</td>
                    <td className="p-3">
                      {p.sale_price != null ? <><div className="font-semibold">{rs(p.sale_price)}</div><div className="text-xs text-muted-foreground line-through">{rs(p.price)}</div></> : rs(p.price)}
                    </td>
                    <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${STOCK_CLS[s]}`}>{STOCK_LABEL[s]}</span><div className="mt-1 text-xs text-muted-foreground">{p.stock_quantity} pcs</div></td>
                    <td className="p-3">{p.is_active ? "Active" : "Deactivated"}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No products match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
