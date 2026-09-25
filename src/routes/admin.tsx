import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Store Admin — Play Town" },
      { name: "description", content: "Manage Play Town orders, products, coupons and delivery." },
      { property: "og:title", content: "Store Admin — Play Town" },
      { property: "og:description", content: "Manage Play Town orders, products, coupons and delivery." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Store Admin</h1>
      <p className="mt-3 text-muted-foreground">This page is coming soon.</p>
      <Link to="/shop" className="mt-6 inline-block underline">Keep shopping</Link>
    </main>
  );
}
