import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/store/PolicyPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Play Town" },
      { name: "description", content: "How Play Town collects, uses and protects your personal information when you shop with us." },
      { property: "og:title", content: "Privacy Policy — Play Town" },
      { name: "description", content: "How Play Town collects, uses and protects your personal information." },
      { property: "og:description", content: "How Play Town collects, uses and protects your personal information." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PolicyPage title="Privacy Policy" updated="September 2026">
      <p>Play Town respects your privacy. We collect only the information needed to process your order and keep you updated — your name, contact number, delivery address and order details.</p>
      <h2>How we use your information</h2>
      <li>To process and deliver your orders across Pakistan.</li>
      <li>To send you order updates on WhatsApp, SMS or email.</li>
      <li>To provide customer support when you contact us.</li>
      <h2>What we never do</h2>
      <li>We never sell or rent your personal details to anyone.</li>
      <li>We never store your card details — card payments run through a secure hosted checkout.</li>
      <h2>Your choices</h2>
      <p>You can ask us to update or remove your details any time by emailing playtown.pk1@gmail.com or messaging us on WhatsApp.</p>
    </PolicyPage>
  ),
});
