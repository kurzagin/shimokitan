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
  const stageItems = illustrations.slice(0, 6);

  /** ── Echo Field (infinite scroll) ─────────────────────── */
  const [echoItems, setEchoItems] = useState<Illustration[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(0);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const mockEcho: Illustration[] = [
    { id: "e1", slug: "e1", title: "NEON_HEART_OVERLOAD", artist: "X_RAY", image: "https://images.unsplash.com/photo-1605142859862-978be7eba909?q=80&w=800", resonance: 0.98, description: "", category: "art", width: 800, height: 1200 },
    { id: "e2", slug: "e2", title: "STATION_SIDE_RAIN", artist: "CYBER", image: "https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=800", resonance: 0.94, description: "", category: "art", width: 800, height: 530 },
    { id: "e3", slug: "e3", title: "SIGNAL_GHOST", artist: "GHOST", image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800", resonance: 0.88, description: "", category: "art", width: 800, height: 800 },
    { id: "e4", slug: "e4", title: "GLITCH_GARDEN", artist: "BOTANIC", image: "https://images.unsplash.com/photo-1542641728-6ca359b085f4?q=80&w=800", resonance: 0.92, description: "", category: "art", width: 800, height: 1100 },
    { id: "e5", slug: "e5", title: "VOICE_ALLEY", artist: "SILENT", image: "https://images.unsplash.com/photo-1515191107209-c28698631303?q=80&w=800", resonance: 0.85, description: "", category: "art", width: 800, height: 600 },
    { id: "e6", slug: "e6", title: "DATA_STRATA", artist: "ARCHITECT", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=800", resonance: 0.99, description: "", category: "art", width: 800, height: 1200 },
    { id: "e7", slug: "e7", title: "CYBER_NOMAD_01", artist: "NOMAD", image: "https://images.unsplash.com/photo-1533900298358-e419f511addc?q=80&w=800", resonance: 0.91, description: "", category: "art", width: 800, height: 530 },
    { id: "e8", slug: "e8", title: "VOID_WALKER", artist: "WALKER", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800", resonance: 0.95, description: "", category: "art", width: 800, height: 800 },
    { id: "e9", slug: "e9", title: "TOKYO_PULSE", artist: "PULSE", image: "https://images.unsplash.com/photo-1540959733332-e94e270b4d82?q=80&w=800", resonance: 0.89, description: "", category: "art", width: 800, height: 450 },
    { id: "e10", slug: "e10", title: "NEON_DREAMS", artist: "DREAMER", image: "https://images.unsplash.com/photo-1493246507139-91e8bef99c02?q=80&w=800", resonance: 0.93, description: "", category: "art", width: 800, height: 1000 },
    { id: "e11", slug: "e11", title: "STATION_EXIT_5", artist: "EXIT", image: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?q=80&w=800", resonance: 0.82, description: "", category: "art", width: 800, height: 534 },
    { id: "e12", slug: "e12", title: "ROOF_TOP_SIGNAL", artist: "SIGNAL", image: "https://images.unsplash.com/photo-1495562569060-2eec283d3391?q=80&w=800", resonance: 0.87, description: "", category: "art", width: 800, height: 1200 },
    { id: "e13", slug: "e13", title: "CYBER_PUNK_2024", artist: "FUTURE", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800", resonance: 0.97, description: "", category: "art", width: 800, height: 600 },
    { id: "e14", slug: "e14", title: "DIGITAL_RAIN", artist: "CODE", image: "https://images.unsplash.com/photo-1504333638930-c8787321eba0?q=80&w=800", resonance: 0.96, description: "", category: "art", width: 800, height: 1067 },
    { id: "e15", slug: "e15", title: "STREET_LOGIC", artist: "LOGIC", image: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=800", resonance: 0.84, description: "", category: "art", width: 800, height: 534 },
    { id: "e16", slug: "e16", title: "VIRTUAL_REALITY", artist: "VR_MASTER", image: "https://images.unsplash.com/photo-1478416272538-5f7e51dc5400?q=80&w=800", resonance: 0.90, description: "", category: "art", width: 800, height: 1200 },
    { id: "e17", slug: "e17", title: "SYST_ERROR_0x", artist: "GLITCH", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800", resonance: 0.77, description: "", category: "art", width: 800, height: 534 },
    { id: "e18", slug: "e18", title: "DATA_PORTAL", artist: "GATE", image: "https://images.unsplash.com/photo-1510511459019-5dee19ff018b?q=80&w=800", resonance: 0.99, description: "", category: "art", width: 800, height: 800 },
    { id: "e19", slug: "e19", title: "SHIMOKITA_GLOW", artist: "GLOW", image: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=800", resonance: 0.92, description: "", category: "art", width: 800, height: 534 },
    { id: "e20", slug: "e20", title: "ABSTRACT_WAVE", artist: "WAVE", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800", resonance: 0.90, description: "", category: "art", width: 800, height: 450 },
  ];

  /**
   * Fetches the next page of illustrations from the API.
   * Falls back to mock data if the API returns nothing.
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
        setEchoItems((prev) => [...prev, ...data.items]);
        setNextCursor(data.nextCursor);
      } else {
        // No DB data — seed with mock once
        if (echoItems.length === 0) {
          setEchoItems(mockEcho);
        }
        setNextCursor(null);
      }
    } catch {
      // API error — seed with mock once
      if (echoItems.length === 0) {
        setEchoItems(mockEcho);
      }
      setNextCursor(null);
    }

    setIsLoading(false);
  }, [isLoading, nextCursor, locale, echoItems.length]);

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
  const get = (i: number) =>
    stageItems[i] || mockEcho[i] || mockEcho[0];

  return (
    <div className="space-y-4">
      {/* ════════════════════════════════════════════════════════════════
          SECTION 1: GALLERY STAGE (Curated Bento)
         ════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[200px] md:auto-rows-[260px]">
        {/* Hero — col-span-2, row-span-2 */}
        <div className="col-span-2 row-span-2 relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
          <img
            src={get(0).image || ""}
            alt={get(0).title}
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
                {get(0).description || "Explore the visual signals captured within the district boundaries."}
              </p>
            </div>
          </div>
        </div>

        {/* Tall portrait shard */}
        <StageShard item={get(1)} label="SIGNAL_01" accent="rose" className="row-span-2" />

        {/* Two stacked squares */}
        <StageShard item={get(2)} label="SIGNAL_02" accent="violet" />
        <StageShard item={get(3)} label="SIGNAL_03" accent="rose" />
      </div>

      {/* Second stage row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[200px] md:auto-rows-[240px]">
        <StageShard item={get(4)} label="ECHO_04" accent="violet" />
        <StageShard item={get(5)} label="ECHO_05" accent="rose" />

        {/* Wide landscape shard — col-span-2 */}
        <div className="col-span-2 relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
          <img
            src={mockEcho[1]?.image || ""}
            alt={mockEcho[1]?.title || ""}
            className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-80 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-zinc-950/30" />
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="text-[9px] font-black text-violet-500 uppercase tracking-widest italic mb-1 bg-violet-500/10 border-l-2 border-violet-500 px-2 py-0.5 inline-block">
              FEATURED_LANDSCAPE
            </div>
            <h4 className="text-sm font-black text-white italic truncate uppercase">
              {mockEcho[1]?.title || "SHARD_VOID"}
            </h4>
          </div>
        </div>
      </div>

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
      href={`/artifacts/${item.id}`}
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
      href={`/artifacts/${item.id}`}
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
