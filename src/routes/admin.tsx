import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Package } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Store Admin — Play Town" },
      { name: "description", content: "Manage Play Town orders, shipping labels and store stats." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Store Admin — Play Town" },
      { property: "og:description", content: "Manage Play Town orders, shipping labels and store stats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <main className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Loading…</main>;
  if (!user)
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Admin sign in required</h1>
        <p className="mt-2 text-muted-foreground">Please sign in with your admin account.</p>
        <Link to="/auth" search={{ redirect: "/admin" }} className="pill-btn pill-primary mt-6 inline-flex">Sign in</Link>
      </main>
    );
  if (!isAdmin)
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">No access</h1>
        <p className="mt-2 text-muted-foreground">This account is not a store admin.</p>
        <Link to="/" className="mt-6 inline-block underline">Back to store</Link>
      </main>
    );
  const cls = "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold";
  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
      <nav className="admin-nav mb-6 flex flex-wrap items-center gap-2 border-b pb-4">
        <h1 className="mr-4 text-xl font-bold">Store Admin</h1>
        <Link to="/admin" activeOptions={{ exact: true }} className={cls} activeProps={{ className: "bg-primary text-primary-foreground" }}><LayoutDashboard className="h-4 w-4" />Dashboard</Link>
        <Link to="/admin/orders" className={cls} activeProps={{ className: "bg-primary text-primary-foreground" }}><Package className="h-4 w-4" />Orders</Link>
      </nav>
      <Outlet />
    </div>
  );
}
