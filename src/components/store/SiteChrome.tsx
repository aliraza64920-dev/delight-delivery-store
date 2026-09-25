import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Mail, MapPin, Menu, Search, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { useCart, useWishlist } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { configQuery } from "@/lib/queries";
import { waLink } from "@/lib/format";
import logoAsset from "@/assets/playtown-logo.png.asset.json";
import { WhatsAppIcon } from "./WhatsAppIcon";

const NAV = [
  { to: "/shop", label: "Shop", search: {} },
  { to: "/shop", label: "New Arrivals", search: { sort: "newest" } },
  { to: "/shop", label: "Sale", search: { sale: true } },
  { to: "/track", label: "Track Order", search: undefined },
] as const;

export function Header() {
  const { count } = useCart();
  const wish = useWishlist();
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    setOpen(false);
    navigate({ to: "/shop", search: { q: q.trim() || undefined } });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <nav className="mx-auto flex max-w-[1180px] items-center justify-between gap-1 px-2 py-3 sm:gap-4 sm:px-5" aria-label="Main">
        <Link to="/" className="flex shrink-0 items-center" aria-label="Play Town home">
          <img src={logoAsset.url} alt="Play Town" className="h-[65px] w-[110px] object-contain sm:h-[82px] sm:w-[148px]" />
        </Link>
        <ul className="hidden gap-6 text-[0.94rem] font-semibold lg:flex">
          <li><Link to="/" className="opacity-85 hover:opacity-100" activeOptions={{ exact: true }} activeProps={{ className: "underline underline-offset-4" }}>Home</Link></li>
          {NAV.map((n) => (
            <li key={n.label}><Link to={n.to} search={n.search as never} className="opacity-85 hover:opacity-100">{n.label}</Link></li>
          ))}
          {isAdmin && <li><Link to="/admin" className="text-hotpink">Admin</Link></li>}
        </ul>
        <div className="flex shrink-0 items-center gap-0 sm:gap-1">
          <IconBtn label="Search" onClick={() => setSearchOpen((s) => !s)}><Search className="h-5 w-5" /></IconBtn>
          <Link to="/wishlist" aria-label="Wishlist" className="relative flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted">
            <Heart className="h-5 w-5" />
            {wish.length > 0 && <Badge n={wish.length} />}
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && <Badge n={count} />}
          </Link>
          <IconBtn label="Menu" className="lg:hidden" onClick={() => setOpen((o) => !o)}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</IconBtn>
        </div>
      </nav>
      {searchOpen && (
        <form onSubmit={submit} className="mx-auto flex max-w-[1180px] gap-2 px-5 pb-3">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search toys, brands, categories or SKU…" className="field" aria-label="Search products" />
          <button className="pill-btn pill-primary">Search</button>
        </form>
      )}
      {open && (
        <div className="border-t bg-background px-5 py-3 lg:hidden">
          <ul className="flex flex-col text-base font-semibold">
            <li><Link to="/" onClick={() => setOpen(false)} className="block py-3">Home</Link></li>
            {NAV.map((n) => (
              <li key={n.label}><Link to={n.to} search={n.search as never} onClick={() => setOpen(false)} className="block py-3">{n.label}</Link></li>
            ))}
            {isAdmin && <li><Link to="/admin" onClick={() => setOpen(false)} className="block py-3 text-hotpink">Admin</Link></li>}
          </ul>
        </div>
      )}
    </header>
  );
}

function IconBtn({ children, label, onClick, className = "" }: { children: React.ReactNode; label: string; onClick: () => void; className?: string }) {
  return (
    <button aria-label={label} onClick={onClick} className={`flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted ${className}`}>{children}</button>
  );
}
function Badge({ n }: { n: number }) {
  return <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-hotpink px-1 text-[0.62rem] font-bold text-primary-foreground">{n}</span>;
}

export function Footer() {
  return (
    <footer className="mt-10 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1.15fr_1fr]">
        <div>
          <Link to="/" aria-label="Play Town home"><img src={logoAsset.url} alt="Play Town" className="h-28 w-48 object-contain" /></Link>
          <p className="mt-2 text-sm leading-relaxed opacity-85">Bringing joy to every child — trusted by families across Pakistan. Toys for every age, occasion and budget, delivered to your doorstep.</p>
          <div className="mt-5 space-y-2.5 text-sm">
            <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> Shop 4012, 4th Floor, Central Plaza, Karachi</p>
            <a href={waLink("923002552414", "Hi Play Town! I have a question.")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline"><WhatsAppIcon className="h-4 w-4 shrink-0" /> 0300 2552414</a>
            <a href="mailto:playtown.pk1@gmail.com" className="flex items-center gap-2 break-all hover:underline"><Mail className="h-4 w-4 shrink-0" /> playtown.pk1@gmail.com</a>
          </div>
          <p className="mt-4 text-xs opacity-70">Cash on Delivery &amp; secure card payments accepted</p>
        </div>
        <FooterCol
          title="Shop By"
          links={[
            { l: "New Arrivals", to: "/shop", search: { sort: "newest" } },
            { l: "Best Sellers", to: "/shop", search: { sort: "popular" } },
            { l: "On Sale", to: "/shop", search: { sale: true } },
          ]}
        />
        <FooterCol
          title="Help & Contact"
          links={[
            { l: "Track Your Order", to: "/track" },
            { l: "My Wishlist", to: "/wishlist" },
            { l: "Shopping Cart", to: "/cart" },
            { l: "Chat on WhatsApp", href: waLink("923002552414", "Hi Play Town! I need help.") },
          ]}
        />
        <FooterCol
          title="Information"
          links={[
            { l: "Privacy Policy", to: "/privacy" },
            { l: "Shipping Policy", to: "/shipping" },
            { l: "Refund & Returns", to: "/refund" },
            { l: "Terms of Service", to: "/terms" },
          ]}
        />
      </div>
      <div className="border-t border-primary-foreground/10 py-4 text-center text-xs opacity-70">© {new Date().getFullYear()} Play Town. All rights reserved.</div>
    </footer>
  );
}

type FooterLink = { l: string; to?: string; search?: Record<string, unknown>; href?: string };

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">{title}</h3>
      <ul className="space-y-2 text-sm opacity-85">
        {links.map((x) => (
          <li key={x.l}>
            {x.href
              ? <a href={x.href} target="_blank" rel="noopener noreferrer" className="hover:underline">{x.l}</a>
              : <Link to={(x.to ?? "/") as never} search={x.search as never} className="hover:underline">{x.l}</Link>}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function WhatsAppFloat() {
  const { data } = useQuery(configQuery());
  const number = data?.whatsapp ?? "923002552414";
  return (
    <a
      href={waLink(number, "Hi Play Town! I have a question.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-primary-foreground shadow-lift transition hover:scale-110"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
