import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardStats } from "@/lib/admin.functions";
import { formatRs } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/order-status";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const fn = useServerFn(getDashboardStats);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fn() });
  if (isLoading) return <p className="text-muted-foreground">Loading stats…</p>;
  if (error || !data) return <p className="text-destructive">Could not load stats.</p>;
  const cards: { label: string; value: string; status?: string }[] = [
    { label: "Total Orders", value: String(data.total) },
    ...ORDER_STATUSES.map((s) => ({ label: `${s.label} Orders`, value: String(data.by[s.value] ?? 0), status: s.value })),
    { label: "Total COD Pending", value: formatRs(data.codPending) },
    { label: "Total Revenue (paid)", value: formatRs(data.revenue) },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <Link key={c.label} to="/admin/orders" search={c.status ? { status: c.status } : {}} className="rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-md">
          <div className="text-xs font-semibold uppercase text-muted-foreground">{c.label}</div>
          <div className="mt-2 text-2xl font-bold">{c.value}</div>
        </Link>
      ))}
    </div>
  );
}
