import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Check, CreditCard, Loader2, Banknote, Truck } from "lucide-react";
import { useCart, useCoupon, setCoupon, clearCart } from "@/lib/cart";
import { formatRs } from "@/lib/format";
import { configQuery } from "@/lib/queries";
import { placeOrder, quoteCart } from "@/lib/store.functions";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout/")({
  validateSearch: (s: Record<string, unknown>) => ({ cancelled: s.cancelled ? 1 : undefined }),
  head: () => ({
    meta: [
      { title: "Checkout — Play Town" },
      { name: "description", content: "Complete your Play Town order with card or cash on delivery." },
      { property: "og:title", content: "Checkout — Play Town" },
      { property: "og:description", content: "Complete your Play Town order with card or cash on delivery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().regex(/^(\+?92|0)3\d{2}[- ]?\d{7}$/, "Enter a valid mobile number, e.g. 03001234567"),
  email: z.string().trim().email("Enter a valid email").max(200),
  address: z.string().trim().min(8, "Enter your complete address").max(400),
  city: z.string().trim().min(2, "Select your city").max(80),
  postalCode: z.string().trim().max(10, "Too long").optional().or(z.literal("")),
  notes: z.string().trim().max(500, "Max 500 characters").optional().or(z.literal("")),
});
type Addr = z.infer<typeof addressSchema>;
const EMPTY: Addr = { fullName: "", phone: "", email: "", address: "", city: "", postalCode: "", notes: "" };
const STEPS = ["Address", "Delivery & Payment", "Review"];

function Page() {
  const { items } = useCart();
  const coupon = useCoupon();
  const { user } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data: config } = useQuery(configQuery());
  const quoteFn = useServerFn(quoteCart);
  const placeFn = useServerFn(placeOrder);

  const [step, setStep] = useState(0);
  const [addr, setAddr] = useState<Addr>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Addr, string>>>({});
  const [payment, setPayment] = useState<"cod" | "card">("cod");
  const [couponInput, setCouponInput] = useState("");
  const [agree, setAgree] = useState(false);
  const [placing, setPlacing] = useState(false);
  const idem = useRef<string>("");

  useEffect(() => {
    idem.current = crypto.randomUUID();
    if (search.cancelled) toast.error("Payment was cancelled. No money was taken.");
    try {
      const saved = sessionStorage.getItem("pt-checkout-addr");
      if (saved) setAddr({ ...EMPTY, ...JSON.parse(saved) });
    } catch { /* ignore */ }
  }, [search.cancelled]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: a }, { data: p }] = await Promise.all([
        supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("profiles").select("full_name,phone").eq("id", user.id).maybeSingle(),
      ]);
      setAddr((cur) => ({
        ...cur,
        fullName: cur.fullName || a?.full_name || p?.full_name || "",
        phone: cur.phone || a?.phone || p?.phone || "",
        email: cur.email || user.email || "",
        address: cur.address || a?.address || "",
        city: cur.city || a?.city || "",
        postalCode: cur.postalCode || a?.postal_code || "",
      }));
    })();
  }, [user]);

  useEffect(() => {
    try { sessionStorage.setItem("pt-checkout-addr", JSON.stringify(addr)); } catch { /* ignore */ }
  }, [addr]);

  useEffect(() => {
    if (config && !config.codEnabled && config.cardEnabled) setPayment("card");
  }, [config]);

  const itemsKey = useMemo(() => items.map((i) => ({ productId: i.productId, quantity: i.quantity })), [items]);
  const { data: quote, isFetching: quoting } = useQuery({
    queryKey: ["quote", itemsKey, addr.city, coupon, addr.email, addr.phone],
    queryFn: () => quoteFn({ data: { items: itemsKey, city: addr.city || undefined, couponCode: coupon, email: addr.email || undefined, phone: addr.phone || undefined } }),
    enabled: items.length > 0,
  });

  if (!items.length)
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="text-6xl">🛒</div>
        <h1 className="mt-4 font-display text-3xl font-bold">Your cart is empty</h1>
        <Link to="/shop" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground">Start shopping</Link>
      </main>
    );

  const set = (k: keyof Addr) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setAddr({ ...addr, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };

  const validateAddress = () => {
    const r = addressSchema.safeParse(addr);
    if (r.success) { setErrors({}); return true; }
    const e: Partial<Record<keyof Addr, string>> = {};
    r.error.issues.forEach((i) => { const k = i.path[0] as keyof Addr; if (!e[k]) e[k] = i.message; });
    setErrors(e);
    return false;
  };

  const next = () => {
    if (step === 0) {
      if (!validateAddress()) return;
      if (quote && !quote.deliveryAvailable) { setErrors({ city: `We don't deliver to ${addr.city} right now.` }); return; }
    }
    if (step === 1) {
      if (payment === "cod" && !config?.codEnabled) return toast.error("Cash on Delivery is unavailable.");
      if (payment === "card" && !config?.cardEnabled) return toast.error("Card payment is unavailable.");
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const applyCoupon = () => {
    const c = couponInput.trim().toUpperCase();
    if (c) setCoupon(c);
    setCouponInput("");
  };

  const submit = async () => {
    if (!validateAddress()) { setStep(0); return; }
    if (!agree) return toast.error("Please accept the terms to continue.");
    if (quote?.issues.length) return toast.error(quote.issues.join(" "));
    setPlacing(true);
    try {
      const r = await placeFn({ data: { items: itemsKey, customer: addressSchema.parse(addr), couponCode: coupon, paymentMethod: payment, idempotencyKey: idem.current, origin: window.location.origin } });
      if (!r.ok) { toast.error(r.error); idem.current = crypto.randomUUID(); return; }
      if (r.redirectUrl) { window.location.href = r.redirectUrl; return; }
      clearCart();
      sessionStorage.removeItem("pt-checkout-addr");
      navigate({ to: "/order-confirmation", search: { order: r.orderNumber, t: r.token } });
    } catch {
      toast.error("Something went wrong. Please check your details and try again.");
      idem.current = crypto.randomUUID();
    } finally {
      setPlacing(false);
    }
  };

  const cityRates = config?.cities ?? [];
  const input = "mt-1 w-full rounded-xl border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Checkout</h1>
      <ol className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={i > step}
              onClick={() => i < step && setStep(i)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </button>
            <span className={`hidden text-sm font-semibold sm:inline ${i === step ? "" : "text-muted-foreground"}`}>{s}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <h2 className="font-display text-xl font-bold sm:col-span-2">Delivery address</h2>
              <Field label="Full name" error={errors.fullName}><input className={input} value={addr.fullName} onChange={set("fullName")} autoComplete="name" maxLength={100} /></Field>
              <Field label="Mobile number" error={errors.phone}><input className={input} value={addr.phone} onChange={set("phone")} placeholder="03001234567" inputMode="tel" autoComplete="tel" maxLength={16} /></Field>
              <Field label="Email" error={errors.email} full><input className={input} type="email" value={addr.email} onChange={set("email")} autoComplete="email" maxLength={200} /></Field>
              <Field label="Complete address" error={errors.address} full><textarea className={input} rows={3} value={addr.address} onChange={set("address")} placeholder="House #, street, area" maxLength={400} /></Field>
              <Field label="City" error={errors.city}>
                {cityRates.length ? (
                  <select className={input} value={addr.city} onChange={set("city")}>
                    <option value="">Select city</option>
                    {cityRates.map((c) => <option key={c.city} value={c.city} disabled={!c.available}>{c.city}{c.available ? "" : " (unavailable)"}</option>)}
                  </select>
                ) : (
                  <input className={input} value={addr.city} onChange={set("city")} autoComplete="address-level2" maxLength={80} />
                )}
              </Field>
              <Field label="Postal code (optional)" error={errors.postalCode}><input className={input} value={addr.postalCode} onChange={set("postalCode")} maxLength={10} /></Field>
              <Field label="Order notes (optional)" error={errors.notes} full><textarea className={input} rows={2} value={addr.notes} onChange={set("notes")} placeholder="Landmark, preferred delivery time…" maxLength={500} /></Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold">Delivery</h2>
                <div className="mt-3 flex items-center gap-3 rounded-xl border-2 border-primary p-4">
                  <Truck className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="font-bold">Standard delivery to {addr.city}</div>
                    <div className="text-sm text-muted-foreground">Usually 2–5 working days</div>
                  </div>
                  <span className="font-bold">{quote ? (quote.deliveryFee === 0 ? "Free" : formatRs(quote.deliveryFee)) : "…"}</span>
                </div>
                {config?.freeDeliveryThreshold != null && quote && quote.deliveryFee > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">Add {formatRs(config.freeDeliveryThreshold - quote.subtotal)} more for free delivery.</p>
                )}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Payment method</h2>
                <div className="mt-3 space-y-3">
                  <PayOption active={payment === "cod"} disabled={!config?.codEnabled} onClick={() => setPayment("cod")} icon={<Banknote className="h-5 w-5" />} title="Cash on Delivery" desc={config?.codEnabled === false ? "Currently unavailable" : "Pay in cash when your order arrives"} />
                  <PayOption active={payment === "card"} disabled={!config?.cardEnabled} onClick={() => setPayment("card")} icon={<CreditCard className="h-5 w-5" />} title="Debit / Credit Card" desc={config?.cardEnabled ? `Secure payment via ${config.cardProvider}` : "Coming soon"} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold">Review your order</h2>
              <ReviewBlock title="Deliver to" onEdit={() => setStep(0)}>
                <p className="font-semibold">{addr.fullName}</p>
                <p>{addr.address}, {addr.city}{addr.postalCode ? ` ${addr.postalCode}` : ""}</p>
                <p>{addr.phone} · {addr.email}</p>
                {addr.notes && <p className="text-muted-foreground">Note: {addr.notes}</p>}
              </ReviewBlock>
              <ReviewBlock title="Payment" onEdit={() => setStep(1)}>
                <p>{payment === "cod" ? "Cash on Delivery" : `Card via ${config?.cardProvider ?? "gateway"}`}</p>
              </ReviewBlock>
              <ReviewBlock title="Items">
                <ul className="divide-y">
                  {(quote?.lines ?? []).map((l) => (
                    <li key={l.productId} className="flex justify-between py-2"><span>{l.name} × {l.quantity}</span><span className="font-semibold">{formatRs(l.lineTotal)}</span></li>
                  ))}
                </ul>
              </ReviewBlock>
              {!!quote?.issues.length && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{quote.issues.join(" ")} <Link to="/cart" className="underline">Update cart</Link></p>}
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span>I agree to the <Link to="/terms" className="underline">terms</Link> and <Link to="/refund" className="underline">refund policy</Link>.</span>
              </label>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 ? <button type="button" onClick={() => setStep(step - 1)} className="rounded-full border px-5 py-2.5 font-semibold">Back</button> : <Link to="/cart" className="text-sm underline">Back to cart</Link>}
            {step < 2 ? (
              <button type="button" onClick={next} className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground">Continue</button>
            ) : (
              <button type="button" onClick={submit} disabled={placing || quoting || !quote || !!quote.issues.length} className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground disabled:opacity-50">
                {placing && <Loader2 className="h-4 w-4 animate-spin" />}
                {payment === "cod" ? `Place order · ${quote ? formatRs(quote.total) : ""}` : `Pay ${quote ? formatRs(quote.total) : ""}`}
              </button>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border bg-card p-5">
          <h2 className="font-display text-xl font-bold">Order Summary</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {items.map((i) => <li key={i.productId} className="flex justify-between gap-2"><span className="truncate">{i.name} × {i.quantity}</span><span>{formatRs(i.price * i.quantity)}</span></li>)}
          </ul>
          <div className="mt-4 space-y-2 border-t pt-4 text-sm">
            <Row label="Subtotal" value={quote ? formatRs(quote.subtotal) : "…"} />
            <Row label="Delivery" value={!addr.city ? "Select city" : quote ? (quote.deliveryFee === 0 ? "Free" : formatRs(quote.deliveryFee)) : "…"} />
            {!!quote?.discount && <Row label={`Discount (${quote.coupon?.code})`} value={`− ${formatRs(quote.discount)}`} />}
            <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{quote ? formatRs(quote.total) : "…"}</span></div>
          </div>
          <div className="mt-4">
            {coupon ? (
              <div className="flex items-center justify-between rounded-xl bg-muted p-2 text-sm">
                <span>Coupon <b>{coupon}</b>{quote?.couponError ? <span className="block text-destructive">{quote.couponError}</span> : null}</span>
                <button type="button" className="underline" onClick={() => setCoupon(null)}>Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input className="flex-1 rounded-full border bg-background px-3 py-2 text-sm" placeholder="Coupon code" value={couponInput} maxLength={40} onChange={(e) => setCouponInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyCoupon()} />
                <button type="button" onClick={applyCoupon} className="rounded-full border px-4 text-sm font-semibold">Apply</button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function Field({ label, error, full, children }: { label: string; error?: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block text-sm font-semibold ${full ? "sm:col-span-2" : ""}`}>
      {label}
      {children}
      {error && <span className="mt-1 block text-xs font-normal text-destructive">{error}</span>}
    </label>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>;
}
function PayOption({ active, disabled, onClick, icon, title, desc }: { active: boolean; disabled?: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left disabled:opacity-50 ${active && !disabled ? "border-primary" : "border-border"}`}>
      <span className="text-primary">{icon}</span>
      <span className="flex-1"><span className="block font-bold">{title}</span><span className="text-sm text-muted-foreground">{desc}</span></span>
      <span className={`h-4 w-4 rounded-full border-2 ${active && !disabled ? "border-primary bg-primary" : ""}`} />
    </button>
  );
}
function ReviewBlock({ title, onEdit, children }: { title: string; onEdit?: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-4 text-sm">
      <div className="mb-2 flex justify-between"><h3 className="font-bold">{title}</h3>{onEdit && <button type="button" className="underline" onClick={onEdit}>Edit</button>}</div>
      {children}
    </div>
  );
}
