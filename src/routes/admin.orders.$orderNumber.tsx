import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { getAdminOrder, recordLabel, updateOrderStatus, updatePaymentStatus } from "@/lib/admin.functions";
import { formatRs } from "@/lib/format";
import { ORDER_STATUSES, STATUS_TONE, methodLabel, payKey, payLabel, statusLabel } from "@/lib/order-status";
import { ProductVisual } from "@/components/store/ProductVisual";
import { ShippingLabel, downloadLabelPdf, type LabelData } from "@/components/admin/ShippingLabel";

export const Route = createFileRoute("/admin/orders/$orderNumber")({ component: OrderDetail });

const fmt = (s: string) => new Date(s).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });

function OrderDetail() {
  const { orderNumber } = Route.useParams();
  const qc = useQueryClient();
  const get = useServerFn(getAdminOrder);
  const setStatus = useServerFn(updateOrderStatus);
  const setPay = useServerFn(updatePaymentStatus);
  const label = useServerFn(recordLabel);
  const [busy, setBusy] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [paper, setPaper] = useState<"4x6" | "a4">("4x6");
  const key = ["admin-order", orderNumber];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => get({ data: { orderNumber } }) });

  if (isLoading) return <p className="text-muted-foreground">Loading order…</p>;
  if (!data) return <p>Order not found. <Link to="/admin/orders" className="underline">Back to orders</Link></p>;
  const { order: o, items, history } = data;
  const refresh = () => { qc.invalidateQueries({ queryKey: key }); qc.invalidateQueries({ queryKey: ["admin-orders"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); };

  const changeStatus = async (status: (typeof ORDER_STATUSES)[number]["value"]) => {
    if (status === "cancelled" && !confirm("Cancel this order? Stock will be returned.")) return;
    setBusy(true);
    try {
      const r = await setStatus({ data: { orderId: o.id, status } });
      if (r.ok) toast.success(`Order marked ${statusLabel(status)}`); else toast.error(r.error);
      refresh();
    } catch { toast.error("Could not update the order."); } finally { setBusy(false); }
  };
  const changePay = async (paymentStatus: "pending" | "paid" | "refunded") => {
    setBusy(true);
    try { await setPay({ data: { orderId: o.id, paymentStatus } }); toast.success("Payment status updated"); refresh(); }
    catch { toast.error("Could not update payment."); } finally { setBusy(false); }
  };

  const labelData: LabelData = { ...o, total: Number(o.total), items: items.map((i) => ({ product_name: i.product_name, quantity: i.quantity })) };
  const generate = async () => { setShowLabel(true); await label({ data: { orderId: o.id, action: "generate" } }); refresh(); };
  const print = async () => {
    setShowLabel(true);
    await label({ data: { orderId: o.id, action: "print" } });
    refresh();
    setTimeout(() => window.print(), 150);
  };
  const download = async () => {
    await downloadLabelPdf(labelData);
    await label({ data: { orderId: o.id, action: "download" } });
    refresh();
  };

  const btn = "pill-btn text-sm disabled:opacity-50";
  return (
    <div>
      <style>{`@media print {
        @page { size: ${paper === "4x6" ? "4in 6in" : "A4"}; margin: ${paper === "4x6" ? "0" : "12mm"}; }
        body * { visibility: hidden !important; }
        #shipping-label, #shipping-label * { visibility: visible !important; }
        #shipping-label { position: fixed; left: 0; top: 0; border: ${paper === "4x6" ? "none" : "1px solid #000"} !important; }
        #shipping-label svg { image-rendering: crisp-edges; }
      }`}</style>
      <Link to="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />All orders</Link>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="font-mono text-2xl font-bold">{o.order_number}</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TONE[o.status] ?? "bg-muted"}`}>{statusLabel(o.status)}</span>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">Payment: {payLabel(o.payment_status)}</span>
        <span className="text-sm text-muted-foreground">{fmt(o.created_at)}</span>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button disabled={busy} onClick={() => changeStatus("confirmed")} className={`${btn} pill-primary`}>Confirm Order</button>
        <button disabled={busy} onClick={() => changeStatus("packed")} className={btn}>Mark as Packed</button>
        <button onClick={generate} className={btn}>Generate Shipping Label</button>
        <button onClick={print} className={btn}>Print Label</button>
        <button onClick={download} className={btn}>Download Label as PDF</button>
        <button disabled={busy} onClick={() => changeStatus("shipped")} className={btn}>Mark as Shipped</button>
        <button disabled={busy} onClick={() => changeStatus("delivered")} className={btn}>Mark as Delivered</button>
        <button disabled={busy || o.status === "cancelled"} onClick={() => changeStatus("cancelled")} className={`${btn} text-destructive`}>Cancel Order</button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-2xl border p-4">
            <h3 className="mb-3 font-bold">Products</h3>
            <div className="divide-y">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-3 py-3">
                  <ProductVisual image={i.products?.images?.[0]} emoji={i.products?.emoji ?? "🧸"} color={i.products?.color ?? "blue"} name={i.product_name} className="h-14 w-14 shrink-0 rounded-xl" size="text-2xl" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{i.product_name}</div>
                    <div className="text-xs text-muted-foreground">SKU {i.sku} · {formatRs(Number(i.unit_price))} × {i.quantity}</div>
                  </div>
                  <div className="font-semibold">{formatRs(Number(i.line_total))}</div>
                </div>
              ))}
            </div>
            <dl className="mt-3 space-y-1 border-t pt-3 text-sm">
              <Row k="Subtotal" v={formatRs(Number(o.subtotal))} />
              <Row k="Delivery fee" v={formatRs(Number(o.delivery_fee))} />
              {Number(o.discount) > 0 && <Row k={`Discount${o.coupon_code ? ` (${o.coupon_code})` : ""}`} v={`− ${formatRs(Number(o.discount))}`} />}
              <Row k="Final total" v={formatRs(Number(o.total))} bold />
            </dl>
          </section>

          {showLabel && (
            <section className="rounded-2xl border p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">Shipping label</h3>
                <label className="text-sm">Paper:{" "}
                  <select value={paper} onChange={(e) => setPaper(e.target.value as "4x6" | "a4")} className="rounded-lg border bg-background px-2 py-1">
                    <option value="4x6">4 × 6 in thermal</option>
                    <option value="a4">A4 printer</option>
                  </select>
                </label>
              </div>
              <div className="overflow-x-auto"><ShippingLabel order={labelData} /></div>
            </section>
          )}
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border p-4 text-sm">
            <h3 className="mb-3 font-bold">Customer</h3>
            <div className="font-semibold">{o.customer_name}</div>
            <a href={`tel:${o.phone}`} className="block">{o.phone}</a>
            <div className="text-muted-foreground">{o.email}</div>
            <div className="mt-2">{o.address}</div>
            <div className="font-semibold">{o.city}{o.postal_code ? ` ${o.postal_code}` : ""}</div>
            {o.notes && <div className="mt-2 rounded-lg bg-muted p-2 text-xs">Note: {o.notes}</div>}
          </section>

          <section className="rounded-2xl border p-4 text-sm">
            <h3 className="mb-3 font-bold">Update</h3>
            <label className="block text-xs font-semibold text-muted-foreground">Order status</label>
            <select disabled={busy} value={o.status} onChange={(e) => changeStatus(e.target.value as (typeof ORDER_STATUSES)[number]["value"])} className="mb-3 mt-1 h-10 w-full rounded-xl border bg-background px-3">
              {!ORDER_STATUSES.some((s) => s.value === o.status) && <option value={o.status}>{statusLabel(o.status)}</option>}
              {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <label className="block text-xs font-semibold text-muted-foreground">Payment status ({methodLabel(o.payment_method)})</label>
            <select disabled={busy} value={payKey(o.payment_status)} onChange={(e) => changePay(e.target.value as "pending" | "paid" | "refunded")} className="mt-1 h-10 w-full rounded-xl border bg-background px-3">
              {!["pending", "paid", "refunded"].includes(payKey(o.payment_status)) && <option value={payKey(o.payment_status)}>{payLabel(o.payment_status)}</option>}
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </section>

          <section className="rounded-2xl border p-4 text-sm">
            <h3 className="mb-3 font-bold">Label history</h3>
            {data.label ? (
              <dl className="space-y-1">
                <Row k="Order ID" v={o.order_number} />
                <Row k="Generated" v={fmt(data.label.generated_at)} />
                <Row k="Times printed" v={String(data.label.print_count)} />
                <Row k="PDF downloads" v={String(data.label.download_count)} />
                {data.label.last_printed_at && <Row k="Last printed" v={fmt(data.label.last_printed_at)} />}
              </dl>
            ) : <p className="text-muted-foreground">No label generated yet.</p>}
          </section>

          <section className="rounded-2xl border p-4 text-sm">
            <h3 className="mb-3 font-bold">Timeline</h3>
            <ol className="space-y-2">
              {history.map((h, i) => (
                <li key={i}><span className="font-semibold">{h.status.startsWith("payment_") ? h.note : statusLabel(h.status)}</span> <span className="text-xs text-muted-foreground">{fmt(h.created_at)}</span></li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div className={`flex justify-between gap-3 ${bold ? "text-base font-bold" : ""}`}><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>;
}
