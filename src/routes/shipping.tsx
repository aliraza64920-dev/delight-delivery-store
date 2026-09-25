import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/store/PolicyPage";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping Policy — Play Town" },
      { name: "description", content: "Delivery times, charges and coverage for Play Town orders across Pakistan, including Karachi same-day dispatch." },
      { property: "og:title", content: "Shipping Policy — Play Town" },
      { property: "og:description", content: "Delivery times, charges and coverage for Play Town orders across Pakistan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PolicyPage title="Shipping Policy" updated="September 2026">
      <p>We deliver to every city and town in Pakistan through trusted courier partners. Orders placed before 3 PM are dispatched the same working day.</p>
      <h2>Delivery times</h2>
      <li>Karachi: 1–2 working days.</li>
      <li>Other major cities: 2–4 working days.</li>
      <li>Remote areas: 3–5 working days.</li>
      <h2>Delivery charges</h2>
      <p>Charges are shown clearly at checkout before you confirm your order — no hidden fees added later.</p>
      <h2>Order tracking</h2>
      <p>Once your order ships, we share a tracking number on WhatsApp and email. You can also track any time from the Track Order page.</p>
    </PolicyPage>
  ),
});
