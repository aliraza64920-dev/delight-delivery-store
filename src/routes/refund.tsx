import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/store/PolicyPage";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund & Returns — Play Town" },
      { name: "description", content: "Play Town's simple return and refund process — what qualifies, how to request a return and when refunds are issued." },
      { property: "og:title", content: "Refund & Returns — Play Town" },
      { property: "og:description", content: "Play Town's simple return and refund process for orders across Pakistan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PolicyPage title="Refund & Returns" updated="September 2026">
      <p>We want every child to love what arrives at their door. If something isn't right, tell us within 7 days of delivery and we'll sort it out.</p>
      <h2>What can be returned</h2>
      <li>Toys that arrived damaged, faulty or incomplete.</li>
      <li>The wrong item compared to what you ordered.</li>
      <li>Unopened items in original packaging, within 7 days.</li>
      <h2>How refunds work</h2>
      <li>Cash on Delivery orders: refund via bank transfer or store credit, as you prefer.</li>
      <li>Card payments: refunded to the same card within 5–7 working days.</li>
      <h2>Start a return</h2>
      <p>Message us on WhatsApp at 0300 2552414 or email playtown.pk1@gmail.com with your order number and a photo of the item.</p>
    </PolicyPage>
  ),
});
