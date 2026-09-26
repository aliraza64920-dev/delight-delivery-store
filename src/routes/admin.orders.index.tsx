import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { listAdminOrders } from "@/lib/admin.functions";
import { formatRs } from "@/lib/format";
import { ORDER_STATUSES, STATUS_TONE, methodLabel, payLabel, statusLabel } from "@/lib/order-status";

const search = z.object({ q: z.string().optional(), status: z.string().optional(), payment: z.string().optional(), from: z.string().optional(), to: z.string().optional() });

export const Route = createFileRoute("/admin/orders/")({
  validateSearch: (s: Record<string, unknown>) => search.parse(s),
  component: OrdersPage,
});

const fmtDate = (s: string) => new Date(s).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });

function OrdersPage() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/orders/" });
  const fn = useServerFn(listAdminOrders);
  const [q, setQ] = useState(s.q ?? "");
  useEffect(() => {
    const t = setTimeout(() => { if ((s.q ?? "") !== q) navigate({ search: (p) => ({ ...p, q: q || undefined }) }); }, 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-orders", s], queryFn: () => fn({ data: s }) });
  const set = (k: keyof typeof s, v: string) => navigate({ search: (p) => ({ ...p, [k]: v || undefined }) });
  const inp = "h-10 rounded-xl border bg-background px-3 text-sm";

  return (
    <div>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <input className={`${inp} lg:col-span-2`} placeholder="Search order ID, name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={inp} value={s.status ?? ""} onChange={(e) => set("status", e.target.value)} aria-label="Order status">
          <option value="">All order statuses</option>
          {ORDER_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          <option value="pending_payment">Awaiting payment</option>
        </select>
        <select className={inp} value={s.payment ?? ""} onChange={(e) => set("payment", e.target.value)} aria-label="Payment status">
          <option value="">All payment statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
        <div className="flex gap-2">
          <input type="date" className={`${inp} min-w-0 flex-1`} value={s.from ?? ""} onChange={(e) => set("from", e.target.value)} aria-label="From date" />
          <input type="date" className={`${inp} min-w-0 flex-1`} value={s.to ?? ""} onChange={(e) => set("to", e.target.value)} aria-label="To date" />
        </div>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading orders…</p> : error ? <p className="text-destructive">Could not load orders.</p> : !data?.length ? (
        <p className="rounded-2xl border p-10 text-center text-muted-foreground">No orders found.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>{["Order ID", "Customer", "Phone", "Total", "Payment", "Date", "Status", "Payment status", ""].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {data.map((o) => (
                  <tr key={o.id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-3 font-mono font-semibold">{o.order_number}</td>
                    <td className="px-3 py-3">{o.customer_name}</td>
                    <td className="px-3 py-3">{o.phone}</td>
                    <td className="px-3 py-3 font-semibold">{formatRs(Number(o.total))}</td>
                    <td className="px-3 py-3">{methodLabel(o.payment_method)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{fmtDate(o.created_at)}</td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_TONE[o.status] ?? "bg-muted"}`}>{statusLabel(o.status)}</span></td>
                    <td className="px-3 py-3">{payLabel(o.payment_status)}</td>
                    <td className="px-3 py-3"><Link to="/admin/orders/$orderNumber" params={{ orderNumber: o.order_number }} className="font-semibold text-primary underline">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {data.map((o) => (
              <Link key={o.id} to="/admin/orders/$orderNumber" params={{ orderNumber: o.order_number }} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold">{o.order_number}</span>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_TONE[o.status] ?? "bg-muted"}`}>{statusLabel(o.status)}</span>
                </div>
                <div className="mt-1 text-sm">{o.customer_name} · {o.phone}</div>
                <div className="mt-1 flex justify-between text-sm text-muted-foreground">
                  <span>{methodLabel(o.payment_method)} · {payLabel(o.payment_status)}</span>
                  <span className="font-semibold text-foreground">{formatRs(Number(o.total))}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{fmtDate(o.created_at)}</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
