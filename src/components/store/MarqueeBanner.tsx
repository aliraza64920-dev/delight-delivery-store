const PHRASES = [
  "Play, Learn, Grow",
  "Toys for Every Age & Budget",
  "Cash on Delivery Nationwide",
  "Delivering Smiles Across Pakistan",
  "Safe & Secure Checkout",
  "Little Smiles, Big Smiles",
];

export function TopTicker() {
  const row = [...PHRASES, ...PHRASES];
  return (
    <div className="overflow-hidden border-b bg-hotpink py-2.5 text-primary-foreground" aria-hidden="true">
      <div className="marquee-track flex w-max items-center">
        {row.map((p, i) => (
          <span key={i} className="flex items-center whitespace-nowrap text-[0.82rem] font-bold tracking-wide sm:text-sm">
            <span className="px-5">{p}</span>
            <span className="opacity-60">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const BENEFITS: [string, string, string][] = [
  ["🚚", "Fast Delivery", "Nationwide across Pakistan"],
  ["💵", "Cash on Delivery", "Pay when it arrives"],
  ["💳", "Secure Payments", "Safe hosted checkout"],
  ["🎁", "Gift-Ready Finds", "Toys for every occasion"],
  ["↩️", "Easy Returns", "Simple return process"],
  ["💬", "WhatsApp Support", "We're here to help"],
];

export function TrustMarquee() {
  const row = [...BENEFITS, ...BENEFITS];
  return (
    <section className="section !py-8" aria-hidden="true">
      <div className="overflow-hidden">
        <div className="marquee-track-slow flex w-max items-stretch gap-4">
          {row.map(([e, t, d], i) => (
            <div key={i} className="flex w-64 shrink-0 items-center gap-3 rounded-[var(--radius)] bg-card px-5 py-4 shadow-soft">
              <span className="text-2xl">{e}</span>
              <span>
                <span className="block text-sm font-extrabold">{t}</span>
                <span className="block text-xs text-muted-foreground">{d}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
