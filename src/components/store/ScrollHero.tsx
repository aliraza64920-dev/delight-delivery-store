import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TOYS = [
  { e: "🧸", bg: "bg-blush", x: -28, y: -18, dx: -10, dy: 30, r: -12 },
  { e: "🚗", bg: "bg-baby", x: 26, y: -22, dx: 14, dy: 26, r: 10 },
  { e: "🧩", bg: "bg-butter", x: -24, y: 22, dx: -16, dy: -24, r: 14 },
  { e: "🎎", bg: "bg-lilac", x: 28, y: 20, dx: 12, dy: -30, r: -10 },
  { e: "🎁", bg: "bg-peach", x: 0, y: 34, dx: 0, dy: -20, r: 6 },
];

const PANELS = [
  { kicker: "Play Town", title: "Find Something They'll Love.", body: "Fun, creative and exciting toys for every age, every occasion and every budget." },
  { kicker: "For every age", title: "From first rattles to big builds.", body: "Hand-picked toys for babies, toddlers, kids and teens — sorted so gifting is easy." },
  { kicker: "Delivered across Pakistan", title: "Cash on Delivery or secure card.", body: "Fast nationwide delivery, easy returns and friendly WhatsApp support." },
];

export function ScrollHero() {
  const ref = useRef<HTMLElement>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      setP(Math.min(1, Math.max(0, -r.top / Math.max(total, 1))));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);

  const panelOpacity = (i: number) => {
    const c = (i + 0.5) / PANELS.length;
    const d = Math.abs(p - c) * PANELS.length;
    if (i === 0 && p < c) return 1;
    if (i === PANELS.length - 1 && p > c) return 1;
    return Math.max(0, 1 - Math.max(0, d - 0.25) * 2.2);
  };

  return (
    <section ref={ref} className="relative h-[260vh] bg-gradient-to-b from-baby/50 via-background to-background">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 h-1 bg-primary transition-[width] duration-100" style={{ width: `${p * 100}%` }} />
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-6 px-5 md:grid-cols-[1.05fr_1fr]">
          <div className="relative order-2 min-h-[240px] text-center md:order-1 md:text-left">
            {PANELS.map((panel, i) => {
              const o = panelOpacity(i);
              return (
                <div key={i} className="absolute inset-0 flex flex-col justify-center" style={{ opacity: o, transform: `translateY(${(1 - o) * 16}px)`, pointerEvents: o > 0.5 ? "auto" : "none" }} aria-hidden={o < 0.5}>
                  <span className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">{panel.kicker}</span>
                  {i === 0 ? <h1 className="text-[clamp(2.1rem,5vw,3.4rem)] leading-tight">{panel.title}</h1> : <h2 className="text-[clamp(2rem,4.6vw,3.1rem)] leading-tight">{panel.title}</h2>}
                  <p className="mx-auto mb-6 mt-3 max-w-md text-lg text-muted-foreground md:mx-0">{panel.body}</p>
                  <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                    <Link to="/shop" className="pill-btn pill-primary">Shop Toys</Link>
                    <a href="#finder" className="pill-btn pill-secondary">Find a Gift</a>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="relative order-1 mx-auto aspect-square w-full max-w-[420px] md:order-2">
            <div className="absolute inset-[18%] rounded-full bg-lilac/60 blur-2xl" style={{ transform: `scale(${1 + p * 0.3})` }} />
            {TOYS.map((t, i) => (
              <div
                key={t.e}
                className={cn("absolute left-1/2 top-1/2 flex h-[28%] w-[28%] items-center justify-center rounded-[var(--radius)] text-5xl shadow-soft will-change-transform", t.bg)}
                style={{ transform: `translate(-50%,-50%) translate(${t.x + t.dx * p}%, ${t.y + t.dy * p}%) translate(${(t.x + t.dx * p) * 1.6}px, ${(t.y + t.dy * p) * 1.6}px) rotate(${t.r * (1 - 2 * p)}deg) scale(${1 + Math.sin(p * Math.PI + i) * 0.06})` }}
              >
                {t.e}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground" style={{ opacity: 1 - p * 3 }}>Scroll to explore ↓</div>
      </div>
    </section>
  );
}
