import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" && s.redirect.startsWith("/") && !s.redirect.startsWith("//") ? s.redirect : undefined }),
  head: () => ({
    meta: [
      { title: "Sign In — Play Town" },
      { name: "description", content: "Sign in or create your Play Town account." },
      { property: "og:title", content: "Sign In — Play Town" },
      { property: "og:description", content: "Sign in or create your Play Town account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const go = () => navigate({ to: redirect ?? "/" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        go();
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setBusy(false); }
  };

  const google = async () => {
    if (redirect) sessionStorage.setItem("pt-after-login", redirect);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r && "error" in r && r.error) toast.error("Google sign in failed");
    else go();
  };

  const inp = "h-11 w-full rounded-xl border bg-background px-3";
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-center text-3xl font-bold">{mode === "in" ? "Sign in" : "Create account"}</h1>
      <button onClick={google} className="pill-btn mt-8 w-full justify-center">Continue with Google</button>
      <div className="my-5 text-center text-xs text-muted-foreground">or</div>
      <form onSubmit={submit} className="space-y-3">
        {mode === "up" && <input className={inp} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />}
        <input className={inp} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={inp} type="password" placeholder="Password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button disabled={busy} className="pill-btn pill-primary w-full justify-center disabled:opacity-50">{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}</button>
      </form>
      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-center text-sm underline">
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </main>
  );
}
