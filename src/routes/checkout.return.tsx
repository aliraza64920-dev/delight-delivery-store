import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (s: Record<string, unknown>) => ({ order: String(s.order ?? ""), t: String(s.t ?? "") }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/order-confirmation", search: { order: search.order, t: search.t } });
  },
});
