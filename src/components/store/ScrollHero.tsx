import { Link } from "@tanstack/react-router";
import { ArrowRight, Banknote, Truck } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import poolsAsset from "@/assets/kids-inflatable-pools.jpeg.asset.json";
import stitchAsset from "@/assets/stitch-villa-playset.jpeg.asset.json";
import rcCarAsset from "@/assets/rapidity-rc-car.jpeg.asset.json";
import { cn } from "@/lib/utils";

type HeroPanel = {
  kicker: string;
  title: ReactNode;
  body: string;
  cta: string;
  search: Record<string, string>;
  image: string;
  imageAlt: string;
  backdrop: string;
};

const PANELS: HeroPanel[] = [
  {
    kicker: "Summer splash season",
    title: <>Cool down with <span className="text-hotpink">pool fun!</span></>,
    body: "Bright inflatable pools made for splashy afternoons, little swimmers and endless summer smiles.",
    cta: "Shop Pools & Water Toys",
    search: { category: "Outdoor & Sports" },
    image: poolsAsset.url,
    imageAlt: "Pink and green inflatable pools for children",
    backdrop: "from-baby via-lilac to-butter",
  },
  {
    kicker: "Make-believe magic",
    title: <>Build a little world of <span className="text-hotpink">big stories.</span></>,
    body: "A colourful Stitch villa playset packed with rooms, characters and creative adventures to dream up.",
    cta: "Shop Pretend Play",
    search: { category: "Dolls & Dollhouses" },
    image: stitchAsset.url,
    imageAlt: "Stitch villa dollhouse playset with six figures",
    backdrop: "from-blush via-lilac to-baby",
  },
  {
    kicker: "Race season is here",
    title: <>Fast, fearless & <span className="text-hotpink">Pakistan-ready.</span></>,
    body: "A rugged remote-control racer with chunky tyres, sharp handling and plenty of off-road attitude.",
    cta: "Shop RC Cars",
    search: { category: "Vehicles & RC" },
    image: rcCarAsset.url,
    imageAlt: "Blue and green Rapidity remote-control off-road car",
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
      <div className="sticky top-[90px] h-[calc(100svh-90px)] min-h-[590px] max-h-[760px] py-3 lg:top-[107px] lg:h-[calc(100svh-107px)]">
        <div className="relative mx-auto h-full max-w-[1240px] overflow-hidden rounded-[var(--radius)] bg-card shadow-soft">
          {PANELS.map((panel, index) => {
            const isActive = index === activePanel;
            return (
              <article
                key={panel.kicker}
                className={cn(
                  "absolute inset-0 grid bg-gradient-to-br px-6 py-8 transition-all duration-700 ease-out md:grid-cols-[1.02fr_0.98fr] md:items-center md:gap-10 md:px-12 lg:px-16",
                  panel.backdrop,
                  isActive ? "translate-y-0 opacity-100" : index < activePanel ? "-translate-y-5 opacity-0" : "translate-y-5 opacity-0",
                )}
                aria-hidden={!isActive}
              >
                <div className="z-10 flex flex-col justify-center pt-3 md:pt-0">
                  <span className="mb-4 w-fit rounded-full bg-card px-3 py-1.5 text-xs font-extrabold uppercase text-hotpink shadow-soft">
                    •&nbsp; {panel.kicker}
                  </span>
                  {index === 0 ? (
                    <h1 className="max-w-[620px] text-[2.35rem] leading-[1.02] sm:text-5xl lg:text-6xl">{panel.title}</h1>
                  ) : (
                    <h2 className="max-w-[620px] text-[2.35rem] leading-[1.02] sm:text-5xl lg:text-6xl">{panel.title}</h2>
                  )}
                  <p className="mt-4 max-w-[570px] text-base leading-relaxed text-muted-foreground sm:text-lg">{panel.body}</p>
                  <Link to="/shop" search={panel.search} className="pill-btn pill-primary mt-6 w-fit">
                    {panel.cta}<ArrowRight className="size-4" />
                  </Link>

                  <dl className="mt-7 grid grid-cols-4 gap-3 border-t border-foreground/10 pt-5 sm:mt-9 sm:gap-5">
                    {[["1,200+", "Toys in stock"], ["40+", "Top brands"], ["25k+", "Happy families"], ["4.8★", "Customer rating"]].map(([value, label]) => (
                      <div key={label}>
                        <dt className="font-display text-xl font-extrabold sm:text-2xl">{value}</dt>
                        <dd className="mt-1 text-[0.65rem] font-semibold leading-tight text-muted-foreground sm:text-xs">{label}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="relative mt-6 min-h-0 md:mt-0 md:h-[82%]">
                  <div className="absolute inset-0 overflow-hidden rounded-[var(--radius)] bg-card shadow-lift">
                    <img src={panel.image} alt={panel.imageAlt} className="h-full w-full object-contain p-4 sm:p-7" />
                  </div>
                  <div className="absolute -left-3 top-5 flex items-center gap-2 rounded-xl bg-card px-3 py-2 shadow-lift sm:-left-5">
                    <span className="grid size-8 place-items-center rounded-lg bg-blush"><Truck className="size-4 text-hotpink" /></span>
                    <span><strong className="block text-xs text-hotpink">Free delivery</strong><small className="text-muted-foreground">over Rs. 2,500</small></span>
                  </div>
                  <div className="absolute -bottom-3 right-3 flex items-center gap-2 rounded-xl bg-card px-3 py-2 shadow-lift sm:-right-4 sm:bottom-5">
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