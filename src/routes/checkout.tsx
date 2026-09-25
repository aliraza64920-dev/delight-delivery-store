import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Play Town" },
      { name: "description", content: "Complete your Play Town order with card or cash on delivery." },
      { property: "og:title", content: "Checkout — Play Town" },
      { property: "og:description", content: "Complete your Play Town order with card or cash on delivery." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <p className="mt-3 text-muted-foreground">This page is coming soon.</p>
      <Link to="/shop" className="mt-6 inline-block underline">Keep shopping</Link>
    </main>
  );
}
