import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { productsQuery } from "@/lib/queries";
import { AGES, CATEGORIES } from "@/lib/format";
import { ProductCard } from "@/components/store/ProductCard";
import { ScrollHero } from "@/components/store/ScrollHero";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Play Town — Find Something They'll Love" },
      { name: "description", content: "Pakistani toy store for every age and budget. Plush, building sets, puzzles, dolls and more with Cash on Delivery nationwide." },
      { property: "og:title", content: "Play Town — Find Something They'll Love" },
      { property: "og:description", content: "Toys for every age and budget, delivered across Pakistan with COD or card payment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery()),
  component: Home,
});

const BUDGETS = [
  { label: "Under Rs. 1,000", sub: "Small treats and stocking fillers.", min: undefined, max: 1000, bg: "bg-butter" },
  { label: "Rs. 1,000 – 2,500", sub: "Great everyday gifts.", min: 1000, max: 2500, bg: "bg-peach" },
  { label: "Rs. 2,500 – 5,000", sub: "Birthday-worthy favourites.", min: 2500, max: 5000, bg: "bg-blush" },
  { label: "Rs. 5,000+", sub: "Big, memorable surprises.", min: 5000, max: undefined, bg: "bg-lilac" },
];

function Home() {
  const { data: products } = useSuspenseQuery(productsQuery());
  const best = products.filter((p) => p.is_best_seller || p.is_featured).slice(0, 8);
  const arrivals = products.filter((p) => p.is_new).slice(0, 4);
  const counts = (c: string) => products.filter((p) => p.category === c).length;

  return (
    <>
      <ScrollHero />

      <section className="section">
        <SectionHead title="Shop by Category" sub="Find exactly what they're into." />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link key={c.name} to="/shop" search={{ category: c.name }} className={cn("flex flex-col gap-8 rounded-[var(--radius)] p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-lift", c.bg)}>
              <span className="text-3xl">{c.emoji}</span>
              <span><span className="font-bold">{c.name}</span><br /><span className="text-xs opacity-70">{counts(c.name)} products</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHead title="Find Toys by Age" sub="Age-appropriate picks, curated for every stage." />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {AGES.map((a) => (
            <Link key={a.value} to="/shop" search={{ age: a.value }} className={cn("rounded-[var(--radius)] px-3 py-5 text-center shadow-soft transition hover:-translate-y-1", a.bg)}>
              <span className="mb-2 block text-3xl">{a.emoji}</span><span className="font-bold">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHead title="Great Toys at Every Budget" sub="Quality gifts, whatever you're planning to spend." />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {BUDGETS.map((b) => (
            <Link key={b.label} to="/shop" search={{ min: b.min, max: b.max }} className={cn("rounded-[var(--radius)] p-6 shadow-soft transition hover:-translate-y-1", b.bg)}>
              <div className="mb-1.5 text-lg font-extrabold">{b.label}</div>
              <div className="text-sm">{b.sub}</div>
              <div className="mt-3 text-sm font-bold underline underline-offset-4">Shop This Budget →</div>
            </Link>
          ))}
        </div>
      </section>

      <GiftFinder />

      <section className="section">
        <SectionHead title="Little Favourites" sub="Some of our most-loved toys." link={{ search: { sort: "popular" } }} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{best.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>

      <section className="section">
        <div className="grid overflow-hidden rounded-[28px] md:grid-cols-2">
          <div className="flex flex-col justify-center bg-blush px-8 py-12 md:px-10">
            <h2 className="text-3xl">Birthday Coming Up?</h2>
            <p className="mb-5 mt-2">Make their day a little more special.</p>
            <Link to="/shop" search={{ sort: "popular" }} className="pill-btn pill-primary self-start">Shop Birthday Gifts</Link>
          </div>
          <div className="flex min-h-[220px] items-center justify-center bg-peach text-8xl">🎁</div>
        </div>
      </section>

      <section className="section">
        <SectionHead title="Just Arrived" sub="Fresh finds, hot off the shelf." link={{ search: { sort: "newest" } }} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{arrivals.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>

      <Faq />

      <section className="section">
        <h2 className="mb-6 text-3xl">Why Parents Choose Play Town</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {[["🚚", "Fast Delivery", "Nationwide delivery across Pakistan."], ["💵", "Cash on Delivery", "Pay when your order arrives."], ["💳", "Secure Card Payments", "Hosted checkout, we never see your card."], ["↩️", "Easy Returns", "Simple return process."], ["💬", "WhatsApp Support", "We're here to help."]].map(([e, t, d]) => (
            <div key={t} className="px-2 py-5 text-center"><span className="mb-2 block text-3xl">{e}</span><h3 className="text-base">{t}</h3><p className="text-sm text-muted-foreground">{d}</p></div>
          ))}
        </div>
      </section>
    </>
  );
}

const FAQS = [
  {
    q: "How quick is the delivery?",
    a: "Karachi orders usually arrive within 1–2 working days, and the rest of Pakistan in 2–4 working days. You'll get a confirmation message as soon as your parcel is on its way.",
  },
  {
    q: "Can I pay when the parcel arrives?",
    a: "Yes! Cash on Delivery is available all over Pakistan — just pay the courier at your doorstep. Card payment is also available at checkout if you prefer.",
  },
  {
    q: "What if the toy isn't right for my child?",
    a: "No problem. If the item is unopened and in its original packaging, you can return or exchange it within 7 days of delivery. Just message us and we'll sort it out.",
  },
  {
    q: "How can I check where my order is?",
    a: "Head to our Track Order page, enter your order number and the phone number you used at checkout, and you'll see the latest status of your parcel instantly.",
  },
  {
    q: "Do you help with picking a gift?",
    a: "We'd love to. Try the gift finder on this page for age and budget ideas, or WhatsApp us and our team will suggest toys the birthday kid won't want to put down.",
  },
];

function Faq() {
  return (
    <section className="section">
      <SectionHead title="Questions? We've Got Answers" sub="The things parents ask us most." />
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {FAQS.map((f) => (
          <details key={f.q} className="group rounded-[var(--radius)] bg-card px-5 py-4 shadow-soft open:shadow-lift">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold [&::-webkit-details-marker]:hidden">
              <span>{f.q}</span>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-butter text-lg transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function SectionHead({ title, sub, link }: { title: string; sub: string; link?: { search: Record<string, string> } }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div><h2 className="text-[clamp(1.5rem,3vw,2.1rem)]">{title}</h2><p className="text-muted-foreground">{sub}</p></div>
      {link && <Link to="/shop" search={link.search} className="shrink-0 font-bold underline underline-offset-4">View all →</Link>}
    </div>
  );
}

function GiftFinder() {
  const navigate = useNavigate();
  const [age, setAge] = useState<string | null>(null);
  const [budget, setBudget] = useState<number | null>(null);
  const chip = (sel: boolean) => cn("min-h-11 rounded-full px-4 py-2 text-sm font-bold shadow-soft", sel ? "bg-primary text-primary-foreground" : "bg-card");
  return (
    <section className="section" id="finder">
      <h2 className="text-[clamp(1.5rem,3vw,2.1rem)]">Not Sure What to Buy?</h2>
      <p className="mb-6 text-muted-foreground">Tell us a little about them and we'll find the right toy.</p>
      <div className="rounded-[28px] bg-lilac p-6 md:p-9">
        <div className="mb-2 font-bold">Step 1 — What's their age?</div>
        <div className="mb-6 flex flex-wrap gap-2.5">{AGES.map((a) => <button key={a.value} className={chip(age === a.value)} onClick={() => setAge(a.value)}>{a.label}</button>)}</div>
        <div className="mb-2 font-bold">Step 2 — What's your budget?</div>
        <div className="mb-6 flex flex-wrap gap-2.5">{BUDGETS.map((b, i) => <button key={b.label} className={chip(budget === i)} onClick={() => setBudget(i)}>{b.label}</button>)}</div>
        <button
          className="pill-btn pill-primary"
          onClick={() => {
            const b = budget != null ? BUDGETS[budget] : null;
            navigate({ to: "/shop", search: { age: age ?? undefined, min: b?.min, max: b?.max } });
          }}
        >
          Find My Toys
        </button>
      </div>
    </section>
  );
}
