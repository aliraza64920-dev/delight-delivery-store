import { COLOR_BG } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductVisual({ image, emoji, color, name, className, size = "text-5xl", fit = "cover" }: { image?: string | null; emoji: string; color: string; name: string; className?: string; size?: string; fit?: "cover" | "contain" }) {
  return (
    <div className={cn("flex aspect-square items-center justify-center overflow-hidden", COLOR_BG[color] ?? "bg-baby", className)}>
      {image ? (
        <img src={image} alt={name} loading="lazy" className={cn("h-full w-full", fit === "cover" ? "object-cover" : "object-contain")} />
      ) : (
        <span className={size} role="img" aria-label={name}>{emoji}</span>
      )}
    </div>
  );
}
