import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/store/PolicyPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Play Town" },
      { name: "description", content: "The terms that apply when you shop with Play Town — orders, prices, payments and use of this website." },
      { property: "og:title", content: "Terms of Service — Play Town" },
      { property: "og:description", content: "The terms that apply when you shop with Play Town." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PolicyPage title="Terms of Service" updated="September 2026">
      <p>By shopping on Play Town you agree to these simple terms. They exist to keep things fair and clear for both you and us.</p>
      <h2>Orders</h2>
      <li>An order is confirmed once we verify stock and share confirmation on WhatsApp or email.</li>
      <li>We may cancel an order if an item is out of stock or the price was displayed incorrectly — you'd always be informed first.</li>
      <h2>Prices & payments</h2>
      <li>All prices are in Pakistani Rupees (PKR) and include applicable taxes.</li>
      <li>Payment options: Cash on Delivery or secure card checkout. We never see or store your card details.</li>
      <h2>Using this site</h2>
      <li>Product photos are for illustration; colours may vary slightly from screen to screen.</li>
      <li>Content, logo and product descriptions on this site belong to Play Town and may not be copied without permission.</li>
    </PolicyPage>
  ),
});
