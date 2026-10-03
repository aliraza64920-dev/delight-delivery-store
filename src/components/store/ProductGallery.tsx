import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import { COLOR_BG } from "@/lib/format";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

type GalleryProps = {
  images: string[];
  name: string;
  emoji: string;
  color: string;
};

export function ProductGallery({ images, name, emoji, color }: GalleryProps) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const resetView = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const clampOffset = (z: number, o: { x: number; y: number }) => {
    const el = frameRef.current;
    if (!el || z <= 1) return { x: 0, y: 0 };
    const maxX = (el.clientWidth * (z - 1)) / 2;
    const maxY = (el.clientHeight * (z - 1)) / 2;
    return { x: Math.min(maxX, Math.max(-maxX, o.x)), y: Math.min(maxY, Math.max(-maxY, o.y)) };
  };

  const applyZoom = (next: number, cx?: number, cy?: number) => {
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    const el = frameRef.current;
    setZoom(z);
    setOffset((prev) => {
      let o = prev;
      if (el && cx !== undefined && cy !== undefined) {
        const rect = el.getBoundingClientRect();
        const px = cx - rect.left - rect.width / 2;
        const py = cy - rect.top - rect.height / 2;
        const k = z / (zoom || 1);
        o = { x: px - (px - prev.x) * k, y: py - (py - prev.y) * k };
      }
      return clampOffset(z, o);
    });
  };

  // Wheel zoom (desktop) — non-passive so page doesn't scroll
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      setZoom((z) => {
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * Math.exp(-dy * 0.0018)));
        setOffset((prev) => {
          const rect = el.getBoundingClientRect();
          const px = e.clientX - rect.left - rect.width / 2;
          const py = e.clientY - rect.top - rect.height / 2;
          const k = next / z;
          return clampOffset(next, { x: px - (px - prev.x) * k, y: py - (py - prev.y) * k });
        });
        return next;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
      panStart.current = null;
    } else {
      panStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      applyZoom(pinchStart.current.zoom * (dist / pinchStart.current.dist), cx, cy);
    } else if (panStart.current && zoom > 1) {
      setOffset(clampOffset(zoom, { x: panStart.current.ox + (e.clientX - panStart.current.x), y: panStart.current.oy + (e.clientY - panStart.current.y) }));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) panStart.current = null;
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (zoom > 1) resetView();
    else applyZoom(2.5, e.clientX, e.clientY);
  };

  const go = (dir: 1 | -1) => {
    setIndex((i) => (i + dir + images.length) % images.length);
    resetView();
  };

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, images.length]);

  const current = images[index];
  const bg = COLOR_BG[color] ?? "bg-baby";

  const stage = (
    <div
      ref={frameRef}
      className={cn("relative flex aspect-square w-full items-center justify-center overflow-hidden select-none", bg, zoom > 1 ? "cursor-grab" : "cursor-zoom-in")}
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      role="img"
      aria-label={name}
    >
      {current ? (
        <img
          src={current}
          alt={name}
          draggable={false}
          className="h-full w-full object-cover transition-transform duration-100 ease-out"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
        />
      ) : (
        <span className="text-[8rem]" role="img" aria-label={name}>{emoji}</span>
      )}
    </div>
  );

  return (
    <div>
      <div className="soft-card relative overflow-hidden">
        {stage}
        <div className="absolute right-3 top-3 flex gap-2">
          <button aria-label="Zoom in" onClick={() => applyZoom(zoom + 0.5)} className="flex h-9 w-9 items-center justify-center rounded-full bg-card/90 shadow"><ZoomIn className="h-4 w-4" /></button>
          <button aria-label="Zoom out" onClick={() => applyZoom(zoom - 0.5)} disabled={zoom <= 1} className="flex h-9 w-9 items-center justify-center rounded-full bg-card/90 shadow disabled:opacity-40"><ZoomOut className="h-4 w-4" /></button>
          <button aria-label="Full screen" onClick={() => setFullscreen(true)} className="flex h-9 w-9 items-center justify-center rounded-full bg-card/90 shadow"><Maximize2 className="h-4 w-4" /></button>
        </div>
        {zoom > 1 && (
          <button onClick={resetView} className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-card/90 px-3 py-1 text-xs font-bold shadow">
            Reset zoom ({zoom.toFixed(1)}x)
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button key={src} onClick={() => { setIndex(i); resetView(); }} className={cn("h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2", i === index ? "border-primary" : "border-transparent")}>
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-foreground/95" role="dialog" aria-modal="true" aria-label={`${name} photos`}>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm font-bold text-primary-foreground">{index + 1} / {images.length}</span>
            <div className="flex gap-2">
              <button aria-label="Zoom in" onClick={() => applyZoom(zoom + 0.5)} className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground"><ZoomIn className="h-5 w-5" /></button>
              <button aria-label="Zoom out" onClick={() => applyZoom(zoom - 0.5)} disabled={zoom <= 1} className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground disabled:opacity-40"><ZoomOut className="h-5 w-5" /></button>
              <button aria-label="Close" onClick={() => { setFullscreen(false); resetView(); }} className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground"><X className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
            {images.length > 1 && (
              <button aria-label="Previous photo" onClick={() => go(-1)} className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-card text-foreground shadow"><ChevronLeft className="h-5 w-5" /></button>
            )}
            <div className="h-full max-h-full w-full max-w-3xl">{stage}</div>
            {images.length > 1 && (
              <button aria-label="Next photo" onClick={() => go(1)} className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-card text-foreground shadow"><ChevronRight className="h-5 w-5" /></button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
