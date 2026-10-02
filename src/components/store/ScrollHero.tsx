import { Link } from "@tanstack/react-router";
import { ArrowRight, Banknote, Truck } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import beadBoxAsset from "@/assets/diy-bead-box-showcase.png.asset.json";
import playhouseAsset from "@/assets/playhouse-tent-main.jpeg.asset.json";
import cactusAsset from "@/assets/dancing-cactus-features.jpg.asset.json";
import { cn } from "@/lib/utils";

type HeroPanel = {
  kicker: string;
  title: ReactNode;
  body: string;
  cta: string;
  slug: string;
  image: string;
  imageAlt: string;
  backdrop: string;
};

const PANELS: HeroPanel[] = [
  {
    kicker: "Create, design & sparkle",
    title: <>Make something special with the <span className="text-hotpink">DIY Bead Box.</span></>,
    body: "A colourful jewellery-making kit packed with beads, charms and everything little creators need for bracelets and necklaces.",
    cta: "Shop DIY Bead Box",
    slug: "diy-bead-box",
    image: beadBoxAsset.url,
    imageAlt: "DIY Bead Box jewellery-making kit with colourful beads and bracelets",
    backdrop: "from-baby via-lilac to-butter",
  },
  {
    kicker: "A house made for play",
    title: <>Big adventures begin in the <span className="text-hotpink">Playhouse Tent.</span></>,
    body: "A bright indoor and outdoor hideaway for pretend play, cosy reading time and unforgettable little adventures.",
    cta: "Shop Playhouse Tent",
    slug: "playhouse-tent-kids-indoor-outdoor",
    image: playhouseAsset.url,
    imageAlt: "Colourful children's playhouse tent for indoor and outdoor play",
    backdrop: "from-blush via-lilac to-baby",
  },
  {
    kicker: "Sing, dance & repeat",
    title: <>Meet the playful <span className="text-hotpink">Dancing Cactus.</span></>,
    body: "An interactive musical friend that sings, dances, lights up and repeats what children say for laugh-out-loud playtime.",
    cta: "Shop Dancing Cactus",
    slug: "dancing-cactus",
    image: cactusAsset.url,
    imageAlt: "Dancing Cactus interactive musical toy with lights and voice repeat",
    backdrop: "from-butter via-lilac to-baby",
  },
];

export function ScrollHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const scrollable = section.offsetHeight - window.innerHeight;
      setProgress(Math.min(1, Math.max(0, -rect.top / Math.max(scrollable, 1))));
    };
    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      cancelAnimationFrame(frame);
    };
  }, []);

  const activePanel = Math.min(PANELS.length - 1, Math.floor(progress * PANELS.length));

  return (
    <section ref={sectionRef} className="relative h-[285vh] px-3 pt-3 sm:px-5">
      <div className="sticky top-[90px] h-[calc(100svh-90px)] min-h-[510px] max-h-[760px] py-3 lg:top-[107px] lg:h-[calc(100svh-107px)]">
        <div className="relative mx-auto h-full max-w-[1240px] overflow-hidden rounded-[var(--radius)] bg-card shadow-soft">
          {PANELS.map((panel, index) => {
            const isActive = index === activePanel;
            return (
              <article
                key={panel.kicker}
                className={cn(
                  "absolute inset-0 flex flex-col bg-gradient-to-br px-5 py-5 transition-all duration-700 ease-out sm:px-6 md:grid md:grid-cols-[1.02fr_0.98fr] md:items-center md:gap-10 md:px-12 md:py-8 lg:px-16",
                  panel.backdrop,
                  isActive ? "translate-y-0 opacity-100" : index < activePanel ? "-translate-y-5 opacity-0" : "translate-y-5 opacity-0",
                )}
                aria-hidden={!isActive}
              >
                <div className="z-10 flex shrink-0 flex-col justify-center md:pt-0">
                  <span className="mb-2 w-fit rounded-full bg-card px-3 py-1.5 text-xs font-extrabold uppercase text-hotpink shadow-soft md:mb-4">
                    •&nbsp; {panel.kicker}
                  </span>
                  {index === 0 ? (
                    <h1 className="max-w-[620px] text-[2rem] leading-[1.08] sm:text-5xl lg:text-6xl">{panel.title}</h1>
                  ) : (
                    <h2 className="max-w-[620px] text-[2rem] leading-[1.08] sm:text-5xl lg:text-6xl">{panel.title}</h2>
                  )}
                  <p className="mt-2 max-w-[570px] text-sm leading-snug text-muted-foreground sm:mt-4 sm:text-lg sm:leading-relaxed">{panel.body}</p>
                  <Link to="/products/$slug" params={{ slug: panel.slug }} className="pill-btn pill-primary mt-3 w-fit sm:mt-6">
                    {panel.cta}<ArrowRight className="size-4" />
                  </Link>

                  <dl className="mt-7 hidden grid-cols-4 gap-3 border-t border-foreground/10 pt-5 sm:mt-9 md:grid md:gap-5">
                    {[["1,200+", "Toys in stock"], ["40+", "Top brands"], ["25k+", "Happy families"], ["4.8★", "Customer rating"]].map(([value, label]) => (
                      <div key={label}>
                        <dt className="font-display text-xl font-extrabold sm:text-2xl">{value}</dt>
                        <dd className="mt-1 text-[0.65rem] font-semibold leading-tight text-muted-foreground sm:text-xs">{label}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="relative mt-4 flex min-h-0 flex-1 items-center justify-center pb-5 md:mt-0 md:h-[82%] md:pb-0">
                  <div className="relative aspect-square max-h-full w-full max-w-[560px] overflow-hidden rounded-[var(--radius)] bg-card shadow-lift">
                    <img src={panel.image} alt={panel.imageAlt} className="h-full w-full object-cover" />
                  </div>
                  <div className="absolute -left-3 top-5 hidden items-center gap-2 rounded-xl bg-card px-3 py-2 shadow-lift md:flex md:-left-5">
                    <span className="grid size-8 place-items-center rounded-lg bg-blush"><Truck className="size-4 text-hotpink" /></span>
                    <span><strong className="block text-xs text-hotpink">Free delivery</strong><small className="text-muted-foreground">over Rs. 2,500</small></span>
                  </div>
                  <div className="absolute -bottom-3 right-3 hidden items-center gap-2 rounded-xl bg-card px-3 py-2 shadow-lift md:flex md:-right-4 md:bottom-5">
                    <span className="grid size-8 place-items-center rounded-lg bg-butter"><Banknote className="size-4 text-success" /></span>
                    <span><strong className="block text-xs text-success">Cash on delivery</strong><small className="text-muted-foreground">pay on arrival</small></span>
                  </div>
                </div>
              </article>
            );
          })}

          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5" aria-label={`Slide ${activePanel + 1} of ${PANELS.length}`}>
            {PANELS.map((panel, index) => (
              <span key={panel.kicker} className={cn("h-1.5 rounded-full bg-foreground/20 transition-all", index === activePanel ? "w-7 bg-hotpink" : "w-1.5")} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}