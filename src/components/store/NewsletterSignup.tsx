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
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wider">Newsletter</h3>
      <p className="mt-2 text-sm leading-relaxed opacity-85">
        Get <span className="font-bold">10% off</span> your first order — new arrivals &amp; playtime ideas, straight to your inbox.
      </p>
      {done ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-primary-foreground/10 px-4 py-3">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm font-semibold leading-relaxed">
            You&apos;re in! Use code{" "}
            <span className="rounded-full bg-butter px-2 py-0.5 font-bold text-foreground">WELCOME10</span> at checkout for 10% off.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col items-start gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            aria-invalid={error ? "true" : "false"}
            className="min-h-11 w-full rounded-full border border-primary-foreground/25 bg-primary-foreground/5 px-4 text-sm outline-none placeholder:text-primary-foreground/50 focus:ring-2 focus:ring-ring"
          />
          <button type="submit" disabled={busy} className="pill-btn bg-berry text-primary-foreground">
            {busy ? "Adding…" : "Subscribe"}
          </button>
          {error && <p className="text-sm font-semibold text-butter">{error}</p>}
        </form>
      )}
    </div>
  );
}
