import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Play Town" },
      { name: "description", content: "Sign in or create your Play Town account." },
      { property: "og:title", content: "Sign In — Play Town" },
      { property: "og:description", content: "Sign in or create your Play Town account." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Sign In</h1>
      <p className="mt-3 text-muted-foreground">This page is coming soon.</p>
      <Link to="/shop" className="mt-6 inline-block underline">Keep shopping</Link>
    </main>
  );
}
