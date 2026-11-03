import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/lib/newsletter.functions";

export function NewsletterSignup() {
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
      const res = await subscribe({ data: { email: value, source: "footer_signup" } });
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
    <div className="sm:col-span-2 lg:col-span-4 lg:-mt-5">
      <div className="flex flex-col items-center gap-5 text-center lg:flex-row lg:justify-center lg:gap-12 lg:text-left">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider">Newsletter</h3>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed opacity-85">
            Get <span className="font-bold">10% off</span> your first order — new arrivals &amp; playtime ideas, straight to your inbox.
          </p>
        </div>
        {done ? (
          <div className="flex items-start gap-2.5 rounded-full bg-primary-foreground/10 px-5 py-3 lg:max-w-md">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold leading-relaxed">
              You&apos;re in! Use code{" "}
              <span className="rounded-full bg-butter px-2 py-0.5 font-bold text-foreground">WELCOME10</span> at checkout for 10% off.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="w-full lg:max-w-md">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email address"
                aria-invalid={error ? "true" : "false"}
                className="min-h-11 w-full flex-1 rounded-full border border-primary-foreground/25 bg-primary-foreground/5 px-4 text-sm outline-none placeholder:text-primary-foreground/50 focus:ring-2 focus:ring-ring"
              />
              <button type="submit" disabled={busy} className="pill-btn shrink-0 bg-berry text-primary-foreground">
                {busy ? "Adding…" : "Subscribe"}
              </button>
            </div>
            {error && <p className="mt-2 text-sm font-semibold text-butter">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
