import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function PolicyPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[820px] px-5 py-12">
      <Link to="/shop" className="text-sm text-hotpink hover:underline">← Continue shopping</Link>
      <h1 className="mt-4 text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-sm opacity-60">Last updated: {updated}</p>
      <div className="mt-6 space-y-4 text-[0.95rem] leading-relaxed opacity-90 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </div>
  );
}
