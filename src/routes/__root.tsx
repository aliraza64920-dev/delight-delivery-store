import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "@/lib/auth";
import { syncWishlist } from "@/lib/cart";
import { Header, Footer, WhatsAppFloat } from "@/components/store/SiteChrome";
import { TopTicker, TrustMarquee } from "@/components/store/MarqueeBanner";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-6xl">🧸</div>
        <h1 className="mt-2 text-5xl">404</h1>
        <h2 className="mt-2 text-xl">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This toy must have rolled under the sofa.</p>
        <Link to="/" className="pill-btn pill-primary mt-6">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end. Try again or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="pill-btn pill-primary">Try again</button>
          <a href="/" className="pill-btn pill-secondary">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Play Town — Pakistan's Friendly Toy Store" },
      { name: "description", content: "Shop toys for every age with Cash on Delivery or secure card payment across Pakistan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito+Sans:wght@400;600;700;800&display=swap" },
      { rel: "stylesheet", href: appCss },
       { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function WishlistSync() {
  const { user } = useAuth();
  useEffect(() => {
    if (user) syncWishlist(user.id);
  }, [user]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WishlistSync />
          <TopTicker />
          <Header />
          <main className="min-h-[60vh]">
            <Outlet />
          </main>
          <TrustMarquee />
          <Footer />
          <WhatsAppFloat />
          <Toaster position="top-center" richColors />
        </AuthProvider>
    </QueryClientProvider>
  );
}
