import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Banknote, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/newsletter.functions";
import { SOCIALS } from "./SiteChrome";

export function NewsletterBand() {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await subscribe({ data: { email: value, source: "newsletter_band" } });
      setDone(true);
      setEmail("");
      toast.success(res.already ? "You're already on our list!" : "Thanks! You're on the list.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-berry text-primary-foreground">
      <div className="mx-auto grid max-w-[1180px] gap-9 px-5 py-12 md:grid-cols-[1.25fr_1fr] md:items-center md:py-14">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-80">Get 10% off your first order</p>
          <h2 className="mt-2 text-3xl leading-tight md:text-4xl">
            New arrivals, sales &amp; playtime ideas — straight to your inbox.
          </h2>

          {done ? (
            <div className="mt-6 flex items-start gap-3 rounded-3xl bg-primary-foreground/10 px-5 py-4">
              <Check className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm font-semibold leading-relaxed">
                You&apos;re in! Use code{" "}
                <span className="rounded-full bg-butter px-2 py-0.5 font-bold text-foreground">WELCOME10</span> at
                checkout for 10% off your first order.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mt-6">
              <div className="flex flex-col gap-2 rounded-3xl border border-primary-foreground/25 bg-primary-foreground/5 p-2 sm:flex-row sm:items-center sm:rounded-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-label="Email address"
                  aria-invalid={error ? "true" : "false"}
                  className="min-h-11 w-full bg-transparent px-4 text-base outline-none placeholder:text-primary-foreground/60"
                />
                <button type="submit" disabled={busy} className="pill-btn shrink-0 bg-berry-d text-primary-foreground">
                  {busy ? "Adding…" : "Subscribe"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              {error && <p className="mt-2 text-sm font-semibold text-butter">{error}</p>}
            </form>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold opacity-90">
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0" /> Secure checkout
            </span>
            <span className="flex items-center gap-2">
              <Banknote className="h-4 w-4 shrink-0" /> Cash on delivery
            </span>
          </div>
        </div>

        <div className="rounded-[var(--radius)] bg-primary-foreground/10 p-5 md:p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider opacity-85">Follow us</h3>
          <p className="mt-1.5 text-sm leading-relaxed opacity-80">
            New toys, flash sales and quick replies — message us on WhatsApp any time.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center gap-2 rounded-full bg-primary-foreground/15 px-4 text-sm font-semibold transition hover:bg-primary-foreground/25"
              >
                <Icon className="h-4 w-4 shrink-0" /> {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
