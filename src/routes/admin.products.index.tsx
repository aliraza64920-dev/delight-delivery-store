import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { listAdminProducts, saveAdminProduct, setProductActive } from "@/lib/admin.functions";
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
  low: "bg-warning/20 text-warning-foreground",
  out: "bg-destructive/15 text-destructive",
};
const rs = (n: number) => `Rs. ${Number(n).toLocaleString("en-PK")}`;
const field = "w-full rounded-lg border bg-background px-3 py-2 text-sm";

function AdminProducts() {
  const qc = useQueryClient();
  const list = useServerFn(listAdminProducts);
  const toggle = useServerFn(setProductActive);
  const { data = [], isLoading, error } = useQuery({ queryKey: ["admin-products"], queryFn: () => list() });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Row | "new" | null>(null);

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

  const toggleMut = useMutation({
    mutationFn: (p: Row) => toggle({ data: { id: p.id, active: !p.is_active } }),
    onSuccess: (r, p) => {
      if (!r.ok) return toast.error(r.error);
      toast.success(
        p.is_active
          ? `Deactivated. Hidden from shop${r.orderCount ? `; ${r.orderCount} past order line(s) kept intact` : ""}.`
          : "Product is active again.",
      );
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: () => toast.error("Could not update product."),
  });

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-2xl font-bold">Products <span className="text-base text-muted-foreground">({rows.length}/{data.length})</span></h2>
        <button onClick={() => setEditing("new")} className="pill-btn pill-primary inline-flex items-center gap-1"><Plus className="h-4 w-4" />Add Product</button>
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
              <tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
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
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)} className="rounded-full border p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                        <button
                          aria-label={p.is_active ? `Deactivate ${p.name}` : `Activate ${p.name}`}
                          disabled={toggleMut.isPending}
                          onClick={() => { if (!p.is_active || confirm(`Deactivate "${p.name}"? It will be hidden from the shop; past orders stay unchanged.`)) toggleMut.mutate(p); }}
                          className="rounded-full border p-2 hover:bg-muted"
                        ><Power className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No products match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {editing && <ProductForm key={editing === "new" ? "new" : editing.id} product={editing === "new" ? null : editing} categories={categories} onClose={() => setEditing(null)} />}
    </section>
  );
}

function ProductForm({ product, categories, onClose }: { product: Row | null; categories: string[]; onClose: () => void }) {
  const qc = useQueryClient();
  const save = useServerFn(saveAdminProduct);
  const [f, setF] = useState({
    name: product?.name ?? "", sku: product?.sku ?? "", description: product?.description ?? "",
    category: product?.category ?? categories[0] ?? "", subcategory: product?.subcategory ?? "",
    brand: product?.brand ?? "Play Town", age_range: product?.age_range ?? "3-5 years",
    price: product ? String(product.price) : "", sale_price: product?.sale_price != null ? String(product.sale_price) : "",
    stock_quantity: product ? String(product.stock_quantity) : "0", low_stock_threshold: product ? String(product.low_stock_threshold) : "5",
  });
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [newImg, setNewImg] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const mut = useMutation({
    mutationFn: () => {
      const price = Number(f.price), sale = f.sale_price === "" ? null : Number(f.sale_price);
      const stock = Number(f.stock_quantity), low = Number(f.low_stock_threshold);
      if (!f.name.trim() || !f.sku.trim() || !f.category) throw new Error("Name, SKU and category are required.");
      if (!(price > 0)) throw new Error("Price must be greater than 0.");
      if (sale != null && !(sale > 0 && sale < price)) throw new Error("Sale price must be above 0 and lower than price.");
      if (!Number.isInteger(stock) || stock < 0) throw new Error("Stock must be a whole number, 0 or more.");
      if (!Number.isInteger(low) || low < 0) throw new Error("Low stock level must be a whole number.");
      return save({ data: { id: product?.id ?? null, product: { name: f.name, sku: f.sku, description: f.description, category: f.category, subcategory: f.subcategory || null, brand: f.brand, age_range: f.age_range, price, sale_price: sale, stock_quantity: stock, low_stock_threshold: low, images } } });
    },
    onSuccess: (r) => {
      if (!r.ok) return setErr(r.error);
      toast.success(product ? "Product updated." : "Product added.");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      onClose();
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "Could not save."),
  });

  const addImg = () => {
    try { new URL(newImg.trim()); } catch { return setErr("Enter a valid image URL (https://…)."); }
    setImages([...images, newImg.trim()]); setNewImg(""); setErr(null);
  };
  const move = (i: number, d: number) => { const n = [...images]; [n[i], n[i + d]] = [n[i + d], n[i]]; setImages(n); };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-3 sm:p-8" role="dialog" aria-modal="true" aria-label={product ? "Edit product" : "Add product"}>
      <form onSubmit={(e) => { e.preventDefault(); setErr(null); mut.mutate(); }} className="w-full max-w-2xl rounded-2xl bg-background p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">{product ? "Edit Product" : "Add Product"}</h3>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">Name<input className={field} value={f.name} onChange={set("name")} required /></label>
          <label className="text-sm font-medium">SKU<input className={field} value={f.sku} onChange={set("sku")} required /></label>
          <label className="text-sm font-medium">Brand<input className={field} value={f.brand} onChange={set("brand")} required /></label>
          <label className="text-sm font-medium">Category<select className={field} value={f.category} onChange={set("category")}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="text-sm font-medium">Second category<select className={field} value={f.subcategory} onChange={set("subcategory")}><option value="">None</option>{categories.filter((c) => c !== f.category).map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="text-sm font-medium">Price (Rs.)<input type="number" min="1" className={field} value={f.price} onChange={set("price")} required /></label>
          <label className="text-sm font-medium">Sale price (Rs., optional)<input type="number" min="1" className={field} value={f.sale_price} onChange={set("sale_price")} /></label>
          <label className="text-sm font-medium">Stock quantity<input type="number" min="0" step="1" className={field} value={f.stock_quantity} onChange={set("stock_quantity")} required /></label>
          <label className="text-sm font-medium">Low stock at or below<input type="number" min="0" step="1" className={field} value={f.low_stock_threshold} onChange={set("low_stock_threshold")} /></label>
          <label className="text-sm font-medium sm:col-span-2">Age range<input className={field} value={f.age_range} onChange={set("age_range")} required /></label>
          <label className="text-sm font-medium sm:col-span-2">Description<textarea rows={6} className={field} value={f.description} onChange={set("description")} /></label>
        </div>
        <div className="mt-4">
          <div className="mb-2 text-sm font-medium">Photos ({images.length}) — first photo is the main one</div>
          <div className="space-y-2">
            {images.map((src, i) => (
              <div key={`${src}-${i}`} className="flex items-center gap-2 rounded-lg border p-2">
                <img src={src} alt="" className="h-12 w-12 rounded object-cover" />
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{src}</span>
                <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="p-1 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" aria-label="Move down" disabled={i === images.length - 1} onClick={() => move(i, 1)} className="p-1 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" aria-label="Remove photo" onClick={() => setImages(images.filter((_, j) => j !== i))} className="p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input aria-label="New image URL" placeholder="https://… image URL" className={field} value={newImg} onChange={(e) => setNewImg(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImg(); } }} />
            <button type="button" onClick={addImg} className="pill-btn shrink-0 border">Add photo</button>
          </div>
        </div>
        {err && <p className="mt-3 text-sm text-destructive" role="alert">{err}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="pill-btn border">Cancel</button>
          <button type="submit" disabled={mut.isPending} className="pill-btn pill-primary">{mut.isPending ? "Saving…" : "Save product"}</button>
        </div>
      </form>
    </div>
  );
}
