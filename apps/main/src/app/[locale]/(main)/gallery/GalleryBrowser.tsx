"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@shimokitan/ui";
import { useTime } from "../../../../hooks/use-time";
import Link from "../../../../components/Link";
import { Dictionary } from "@shimokitan/utils";
import { useParams } from "next/navigation";

/** Shape from both server props and API response */
type Illustration = {
  id: string;
  slug: string;
  title: string;
  artist: string;
  image: string | null;
  resonance: number;
  description: string;
  category: string;
  width?: number;
  height?: number;
};

/** Column count per breakpoint */
const COLUMN_COUNTS = { mobile: 2, tablet: 3, desktop: 4 } as const;

/**
 * Gallery: Bento Stage (curated top) + Masonry Echo Field (infinite scroll).
 */
export default function GalleryBrowser({
  illustrations,
  dict,
  weatherTemp,
}: {
  illustrations: Illustration[];
  dict: Dictionary;
  weatherTemp: string;
}) {
  const time = useTime();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  /** ── Stage vs Echo split ──────────────────────────────── */
  // Only items with positive resonance reach the Bento Stage
  const stageItems = (illustrations || []).filter(i => (i.resonance || 0) > 0).slice(0, 6);

  /** ── Echo Field (infinite scroll) ─────────────────────── */
  // Initial echo items are everything not in the stage
  const [echoItems, setEchoItems] = useState<Illustration[]>(
    (illustrations || []).filter(i => !stageItems.some(s => s.id === i.id))
  );

  const [nextCursor, setNextCursor] = useState<number | null>(illustrations.length);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  /**
   * Fetches the next page of illustrations from the API.
   */
  const fetchMore = useCallback(async () => {
    if (isLoading || nextCursor === null) return;
    setIsLoading(true);

    try {
      const res = await fetch(
        `/api/gallery?cursor=${nextCursor}&limit=20&locale=${locale}`
      );
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        setEchoItems((prev) => {
          // Strict deduplication by ID
          const existingIds = new Set(stageItems.map(i => i.id));
          const newItems = data.items.filter((item: Illustration) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
        setNextCursor(data.nextCursor);
      } else {
        setNextCursor(null);
      }
    } catch {
      setNextCursor(null);
    }
    setIsLoading(false);
  }, [isLoading, nextCursor, locale, stageItems, echoItems.length]);

  /** Intersection Observer for infinite scroll */
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchMore();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchMore]);

  /** Trigger first load */
  useEffect(() => {
    fetchMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Safe getter for stage items */
  const get = (i: number) => stageItems[i] || null;

  return (
    <div className="space-y-4">
      {/* ════════════════════════════════════════════════════════════════
          SECTION 1: GALLERY STAGE (Curated Bento)
         ════════════════════════════════════════════════════════════════ */}
      {stageItems.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[200px] md:auto-rows-[260px]">
            {/* Hero — col-span-2, row-span-2 */}
            {get(0) && (
              <div className="col-span-2 row-span-2 relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                <img
                  src={get(0)!.image || ""}
                  alt={get(0)!.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-70 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-zinc-950/50" />
                <div className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_3px)]" />

                <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-10">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] italic mb-1">
                    GALLERY _ PROTOCOLS
                  </span>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-3">
                    VISUAL<span className="text-rose-500">_SHARDS</span>
                  </h1>
                  <div className="p-3 border-l-2 border-rose-500/50 bg-zinc-950/80 backdrop-blur-md max-w-xs">
                    <p className="text-[11px] font-bold text-zinc-300 italic leading-snug">
                      {get(0)!.description || "Explore the visual Signals captured within the district boundaries."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tall portrait shard */}
            {get(1) && (
              <StageShard item={get(1)!} label="SIGNAL_01" accent="rose" className="row-span-2" />
            )}

            {/* Two stacked squares */}
            <div className="flex flex-col gap-3 h-full">
              {get(2) && <StageShard item={get(2)!} label="SIGNAL_02" accent="violet" className="flex-1" />}
              {get(3) && <StageShard item={get(3)!} label="SIGNAL_03" accent="rose" className="flex-1" />}
            </div>
          </div>

          {/* Second stage row */}
          {get(4) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {get(4) && <StageShard item={get(4)!} label="ECHO_04" accent="violet" className="h-[200px] md:h-[240px]" />}
              {get(5) && <StageShard item={get(5)!} label="ECHO_05" accent="rose" className="h-[200px] md:h-[240px]" />}
              
              {/* Dynamic landscape shard — col-span-2 if available */}
              {get(6) && (
                <div className="col-span-2 relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                  <img
                    src={get(6)!.image || ""}
                    alt={get(6)!.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-80 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-zinc-950/30" />
                  <div className="absolute bottom-4 left-4 right-4 z-10">
                    <div className="text-[9px] font-black text-violet-500 uppercase tracking-widest italic mb-1 bg-violet-500/10 border-l-2 border-violet-500 px-2 py-0.5 inline-block">
                      FEATURED_LANDSCAPE
                    </div>
                    <h4 className="text-sm font-black text-white italic truncate uppercase">
                      {get(6)!.title}
                    </h4>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          DIVIDER: Signal HUD
         ════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-4 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">
            ECHO_FIELD
          </span>
        </div>
        <div className="flex-1 h-px bg-zinc-800" />
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono text-zinc-600 uppercase">
            {echoItems.length} SHARDS_LOADED
          </span>
          <span className="text-[10px] font-mono text-zinc-600 uppercase">
            {weatherTemp} // {time} JST
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 2: ECHO FIELD (Masonry + Infinite Scroll)
         ════════════════════════════════════════════════════════════════ */}
      <MasonryGrid items={echoItems} />

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 gap-3">
          <div className="w-1 h-1 bg-rose-500 rounded-full animate-ping" />
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">
            SYNCING_ARCHIVE...
          </span>
          <div className="w-1 h-1 bg-rose-500 rounded-full animate-ping" style={{ animationDelay: "200ms" }} />
        </div>
      )}

      {/* End of data display */}
      {nextCursor === null && echoItems.length > 0 && !isLoading && (
        <div className="flex items-center justify-center py-8 gap-3">
          <div className="h-px w-16 bg-zinc-800" />
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">
            END_OF_ARCHIVE
          </span>
          <div className="h-px w-16 bg-zinc-800" />
        </div>
      )}

      {/* Sentinel for intersection observer */}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   STAGE SHARD — Reusable card for the curated Bento top section
   ════════════════════════════════════════════════════════════════════════ */

function StageShard({
  item,
  label,
  className,
  accent = "rose",
}: {
  item: Illustration;
  label: string;
  className?: string;
  accent?: "rose" | "violet";
}) {
  const isRose = accent === "rose";

  return (
    <Link
      href={`/cinema/${item.id}`}
      className={cn(
        "relative group/shard rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 transition-all duration-500",
        isRose ? "hover:border-rose-500/50" : "hover:border-violet-500/50",
        className
      )}
    >
      <img
        src={item.image || ""}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover/shard:opacity-90 group-hover/shard:scale-105 transition-all duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80" />
      <div className="absolute top-3 left-3 z-10">
        <span className={cn(
          "text-[8px] font-black uppercase tracking-widest italic px-1.5 py-0.5 border-l",
          isRose ? "text-rose-500 bg-rose-500/10 border-rose-500" : "text-violet-500 bg-violet-500/10 border-violet-500"
        )}>
          {label}
        </span>
      </div>
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <h4 className="text-[11px] font-black text-white italic truncate uppercase leading-tight">{item.title}</h4>
        <p className="text-[9px] text-zinc-500 italic uppercase mt-0.5">{item.artist}</p>
      </div>
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover/shard:opacity-100 transition-opacity duration-500 pointer-events-none",
        isRose ? "bg-rose-500/5" : "bg-violet-500/5"
      )} />
    </Link>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MASONRY GRID — CSS Columns based masonry with aspect-ratio aware cards.
   High-resonance items get col-span-2 treatment.
   ════════════════════════════════════════════════════════════════════════ */

function MasonryGrid({ items }: { items: Illustration[] }) {
  if (items.length === 0) return null;

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance-all]">
      {items.map((item, i) => (
        <MasonryShard key={`${item.id}-${i}`} item={item} index={i} />
      ))}
    </div>
  );
}

function MasonryShard({ item, index }: { item: Illustration; index: number }) {
  const [loaded, setLoaded] = useState(false);

  /** Calculate the natural aspect ratio for the placeholder */
  const w = item.width || 800;
  const h = item.height || 800;
  const aspectRatio = w / h;

  /** High-resonance items are visually distinguished */
  const isHighRes = item.resonance >= 0.95;
  const accentColor = index % 2 === 0 ? "rose" : "violet";
  const isRose = accentColor === "rose";

  return (
    <Link
      href={`/cinema/${item.id}`}
      className={cn(
        "block mb-3 break-inside-avoid rounded-xl overflow-hidden border bg-zinc-950 transition-all duration-500 group/card relative",
        isHighRes ? "border-zinc-700" : "border-zinc-800",
        isRose ? "hover:border-rose-500/40" : "hover:border-violet-500/40"
      )}
    >
      {/* Aspect ratio container */}
      <div style={{ aspectRatio: `${w}/${h}` }} className="relative w-full overflow-hidden bg-zinc-900">
        <img
          src={item.image || ""}
          alt={item.title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-all duration-700",
            loaded ? "opacity-100" : "opacity-0",
            "group-hover/card:scale-105"
          )}
        />

        {/* Loading skeleton */}
        {!loaded && (
          <div className="absolute inset-0 bg-zinc-900 animate-pulse" />
        )}

        {/* Bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

        {/* Info overlay on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-500 z-10">
          <h4 className="text-[11px] font-black text-white italic truncate uppercase leading-tight">
            {item.title}
          </h4>
          <p className="text-[9px] text-zinc-400 italic uppercase mt-0.5">
            {item.artist}
          </p>
        </div>

        {/* High-resonance badge */}
        {isHighRes && (
          <div className="absolute top-2 right-2 z-10">
            <div className={cn(
              "text-[7px] font-black uppercase tracking-widest italic px-1.5 py-0.5",
              isRose
                ? "text-rose-500 bg-rose-500/20 border border-rose-500/30"
                : "text-violet-500 bg-violet-500/20 border border-violet-500/30"
            )}>
              HIGH_RES
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

