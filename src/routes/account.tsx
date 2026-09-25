import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — Play Town" },
      { name: "description", content: "Manage your Play Town orders, addresses and details." },
      { property: "og:title", content: "My Account — Play Town" },
      { property: "og:description", content: "Manage your Play Town orders, addresses and details." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">My Account</h1>
      <p className="mt-3 text-muted-foreground">This page is coming soon.</p>
      <Link to="/shop" className="mt-6 inline-block underline">Keep shopping</Link>
    </main>
  );
}
