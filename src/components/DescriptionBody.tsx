import React from "react";

/** Renders the product description's simple markdown (### headings, **bold**, • bullets) as styled text. */
export function DescriptionBody({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const out: React.ReactNode[] = [];
  let bullets: string[] = [];

  const renderInline = (s: string, key: string) => {
    const parts = s.split(/\*\*(.+?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={`${key}-${i}`} className="font-bold text-foreground">{part}</strong> : part
    );
  };

  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    out.push(
      <ul key={key} className="mb-3 ml-5 list-disc space-y-1.5 text-sm text-muted-foreground">
        {bullets.map((b, i) => <li key={i}>{renderInline(b, `b-${key}-${i}`)}</li>)}
      </ul>
    );
    bullets = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (line === "") { flushBullets(`f-${i}`); return; }
    if (line.startsWith("### ")) {
      flushBullets(`h-${i}`);
      out.push(<h3 key={i} className="mb-2 mt-6 text-xl font-bold text-foreground">{renderInline(line.slice(4), `h3-${i}`)}</h3>);
    } else if (line.startsWith("• ")) {
      bullets.push(line.slice(2));
    } else if (/^\*\*.+\*\*$/.test(line)) {
      flushBullets(`s-${i}`);
      out.push(<p key={i} className="mt-4 font-bold text-foreground">{renderInline(line, `s-${i}`)}</p>);
    } else {
      flushBullets(`p-${i}`);
      out.push(<p key={i} className="mb-3 text-sm leading-relaxed text-muted-foreground">{renderInline(line, `p-${i}`)}</p>);
    }
  });
  flushBullets("end");

  return <div className="mt-8 space-y-1">{out}</div>;
}
