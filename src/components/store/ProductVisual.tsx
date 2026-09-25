import { COLOR_BG } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductVisual({ image, emoji, color, name, className, size = "text-5xl" }: { image?: string | null; emoji: string; color: string; name: string; className?: string; size?: string }) {
  return (
    <div className={cn("flex aspect-square items-center justify-center overflow-hidden", COLOR_BG[color] ?? "bg-baby", className)}>
      {image ? (
        <img src={image} alt={name} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className={size} role="img" aria-label={name}>{emoji}</span>
      )}
    </div>
  );
}
