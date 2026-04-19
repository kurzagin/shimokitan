
"use client";

import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@shimokitan/ui";
import { useTheaterStore } from "@/lib/store/theater-store";
import { resolveTranslation } from "@shimokitan/utils";
import Link from "@/components/Link";

type ExhibitType =
  | "trailer"
  | "opening"
  | "ending"
  | "promotion"
  | "gallery"
  | "other";

interface ExhibitTranslation {
  locale: string;
  title: string;
  description?: string | null;
}

interface ExhibitMedia {
  url: string;
  blurhash?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface ExhibitItem {
  id: string;
  type: ExhibitType;
  url?: string | null;
  position: number;
  media?: ExhibitMedia | null;
  translations: ExhibitTranslation[];
}

interface ExhibitGalleryProps {
  exhibits: ExhibitItem[];
  locale: string;
  artifactCategory: string;
  artifactId: string;
  isDatabaseStyle?: boolean;
  dict: any;
}

const TYPE_ICONS: Record<ExhibitType, string> = {
  trailer: "lucide:play-circle",
  opening: "lucide:sunrise",
  ending: "lucide:sunset",
  promotion: "lucide:megaphone",
  gallery: "lucide:image",
  other: "lucide:file",
};

const TYPE_COLORS: Record<ExhibitType, string> = {
  trailer: "text-rose-500",
  opening: "text-amber-500",
  ending: "text-violet-500",
  promotion: "text-sky-500",
  gallery: "text-emerald-500",
  other: "text-zinc-500",
};

const TYPE_BG: Record<ExhibitType, string> = {
  trailer: "bg-rose-500/10 border-rose-500/20",
  opening: "bg-amber-500/10 border-amber-500/20",
  ending: "bg-violet-500/10 border-violet-500/20",
  promotion: "bg-sky-500/10 border-sky-500/20",
  gallery: "bg-emerald-500/10 border-emerald-500/20",
  other: "bg-zinc-500/10 border-zinc-500/20",
};

const isVideoType = (type: ExhibitType): boolean =>
  ["trailer", "opening", "ending"].includes(type);

export function ExhibitGallery({
  exhibits,
  locale,
  artifactCategory,
  artifactId,
  isDatabaseStyle,
  dict,
}: ExhibitGalleryProps) {
  const [activeTab, setActiveTab] = useState<ExhibitType | "all">("all");
  const [lightboxExhibit, setLightboxExhibit] = useState<ExhibitItem | null>(null);

  const availableTabs = useMemo(() => {
    const typeSet = new Set(exhibits.map((e) => e.type));
    const tabs: (ExhibitType | "all")[] = ["all"];
    const order: ExhibitType[] = [
      "trailer",
      "opening",
      "ending",
      "gallery",
      "promotion",
      "other",
    ];
    order.forEach((t) => {
      if (typeSet.has(t)) tabs.push(t);
    });
    return tabs;
  }, [exhibits]);

  const filteredExhibits = useMemo(() => {
    const items =
      activeTab === "all"
        ? exhibits
        : exhibits.filter((e) => e.type === activeTab);
    return items.sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [exhibits, activeTab]);

  const isGalleryMode =
    activeTab === "gallery" ||
    (activeTab === "all" &&
      exhibits.filter((e) => e.type === "gallery").length >
        exhibits.length * 0.6);

  const closeLightbox = () => {
    setLightboxExhibit(null);
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    if (!lightboxExhibit) return;
    const currentIndex = filteredExhibits.findIndex(
      (e) => e.id === lightboxExhibit.id
    );
    const nextIndex =
      direction === "next"
        ? (currentIndex + 1) % filteredExhibits.length
        : (currentIndex - 1 + filteredExhibits.length) %
          filteredExhibits.length;
    setLightboxExhibit(filteredExhibits[nextIndex]);
  };

  if (exhibits.length === 0) return null;

  return (
    <>
      <div className="flex flex-col border-t border-zinc-900">
        <div className="shrink-0 px-3 py-2.5 bg-zinc-950/80 border-b border-zinc-900 flex items-center gap-2">
          <Icon
            icon="lucide:archive"
            width={13}
            className="text-zinc-500 shrink-0"
          />
          <span className="text-xs text-zinc-400 uppercase tracking-[0.35em] font-black">
            {dict.discovery.exhibit}
          </span>
          <span className="ml-auto text-[9px] text-zinc-700 font-mono uppercase">
            {exhibits.length} Item{exhibits.length !== 1 ? "s" : ""}
          </span>
        </div>

        {availableTabs.length > 2 && (
          <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-900/60 bg-zinc-950/40 overflow-x-auto scrollbar-none">
            {availableTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] border transition-all whitespace-nowrap",
                  activeTab === tab
                    ? "bg-zinc-800 border-zinc-700 text-white"
                    : "bg-transparent border-transparent text-zinc-600 hover:text-zinc-400 hover:border-zinc-800"
                )}
              >
                {tab === "all" ? (
                  "All"
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Icon
                      icon={TYPE_ICONS[tab]}
                      width={10}
                      className={TYPE_COLORS[tab]}
                    />
                    {tab}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div
          className={cn(
            "p-3",
            isDatabaseStyle 
              ? "flex flex-col gap-1" 
              : isGalleryMode
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
                : "grid grid-cols-1 sm:grid-cols-2 gap-3"
          )}
        >
          {filteredExhibits.map((exhibit) => {
            const trans = resolveTranslation(exhibit.translations, locale);
            const isVideo = isVideoType(exhibit.type);
            const exhibitHref = `/artifacts/${artifactCategory}/${artifactId}/exhibit/${exhibit.id}`;

            if (isDatabaseStyle) {
              const content = (
                <>
                  <div className="shrink-0 w-36 aspect-video bg-zinc-900 border border-zinc-800 overflow-hidden relative">
                    {exhibit.media?.url ? (
                      <img
                        src={exhibit.media.url}
                        alt={trans?.title || "Exhibit"}
                        className="w-full h-full object-cover grayscale-[0.2] group-hover/row:grayscale-0 transition-all"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
                        <Icon icon={TYPE_ICONS[exhibit.type]} width={16} className="text-zinc-800" />
                      </div>
                    )}
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <Icon icon="lucide:play" width={14} className="text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-black uppercase text-zinc-100 italic tracking-tight truncate leading-none">
                        {trans?.title || "Untitled"}
                      </span>
                      <div className={cn(
                        "shrink-0 px-1 py-0.5 border text-[7px] font-black uppercase tracking-wider leading-none",
                        TYPE_BG[exhibit.type],
                        TYPE_COLORS[exhibit.type]
                      )}>
                        {exhibit.type}
                      </div>
                    </div>
                    {trans?.description && (
                       <p className="text-[10px] text-zinc-500 line-clamp-1 italic font-serif leading-relaxed mt-0.5">
                        {trans.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity pr-2">
                    <Icon 
                        icon={isVideo ? "lucide:external-link" : "lucide:maximize-2"} 
                        width={14} 
                        className="text-zinc-700" 
                    />
                  </div>
                </>
              );

              const className = cn(
                "group/row flex items-center gap-4 p-3 bg-zinc-950/20 border border-zinc-900",
                "hover:border-zinc-700 hover:bg-zinc-900/40 transition-all text-left"
              );

              if (isVideo) {
                return (
                  <Link key={exhibit.id} href={exhibitHref} className={className}>
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={exhibit.id}
                  type="button"
                  onClick={() => setLightboxExhibit(exhibit)}
                  className={className}
                >
                  {content}
                </button>
              );
            }

            if (isVideo) {
                return (
                    <Link
                        key={exhibit.id}
                        href={exhibitHref}
                        className={cn(
                            "group/card relative overflow-hidden border border-zinc-800/60 bg-zinc-900/30 transition-all text-left",
                            "hover:border-zinc-700 hover:bg-zinc-900/60",
                            isGalleryMode ? "aspect-square" : "aspect-video"
                        )}
                    >
                        {exhibit.media?.url ? (
                            <img
                                src={exhibit.media.url}
                                alt={trans?.title || "Exhibit"}
                                className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover/card:opacity-100 group-hover/card:scale-105 transition-all duration-500"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
                                <Icon
                                    icon={TYPE_ICONS[exhibit.type]}
                                    width={isGalleryMode ? 24 : 32}
                                    className="text-zinc-800"
                                />
                            </div>
                        )}

                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all scale-75 group-hover/card:scale-100">
                                <Icon icon="lucide:play" width={16} className="text-white ml-0.5" />
                            </div>
                        </div>

                        <div className="absolute bottom-0 inset-x-0 z-10 bg-black/80 backdrop-blur-sm px-3 py-2 flex items-center gap-2">
                            <div className={cn(
                                "shrink-0 px-1.5 py-0.5 border text-[7px] font-black uppercase tracking-wider",
                                TYPE_BG[exhibit.type],
                                TYPE_COLORS[exhibit.type]
                            )}>
                                {exhibit.type}
                            </div>
                            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tight truncate">
                                {trans?.title || "Untitled"}
                            </span>
                        </div>
                    </Link>
                );
            }

            return (
              <button
                key={exhibit.id}
                type="button"
                onClick={() => setLightboxExhibit(exhibit)}
                className={cn(
                  "group/card relative overflow-hidden border border-zinc-800/60 bg-zinc-900/30 transition-all text-left",
                  "hover:border-zinc-700 hover:bg-zinc-900/60",
                  isGalleryMode ? "aspect-square" : "aspect-video"
                )}
              >
                {exhibit.media?.url ? (
                  <img
                    src={exhibit.media.url}
                    alt={trans?.title || "Exhibit"}
                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover/card:opacity-100 group-hover/card:scale-105 transition-all duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
                    <Icon
                      icon={TYPE_ICONS[exhibit.type]}
                      width={isGalleryMode ? 24 : 32}
                      className="text-zinc-800"
                    />
                  </div>
                )}

                <div className="absolute bottom-0 inset-x-0 z-10 bg-black/80 backdrop-blur-sm px-3 py-2 flex items-center gap-2">
                  <div className={cn(
                    "shrink-0 px-1.5 py-0.5 border text-[7px] font-black uppercase tracking-wider",
                    TYPE_BG[exhibit.type],
                    TYPE_COLORS[exhibit.type]
                  )}>
                    {exhibit.type}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tight truncate">
                    {trans?.title || "Untitled"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {lightboxExhibit && (
        <ExhibitLightbox
          exhibit={lightboxExhibit}
          locale={locale}
          onClose={closeLightbox}
          onPrev={() => navigateLightbox("prev")}
          onNext={() => navigateLightbox("next")}
          totalCount={filteredExhibits.length}
          currentIndex={
            filteredExhibits.findIndex(
              (e) => e.id === lightboxExhibit.id
            ) + 1
          }
        />
      )}
    </>
  );
}

function ExhibitLightbox({
  exhibit,
  locale,
  onClose,
  onPrev,
  onNext,
  totalCount,
  currentIndex,
}: {
  exhibit: ExhibitItem;
  locale: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  totalCount: number;
  currentIndex: number;
}) {
  const trans = resolveTranslation(exhibit.translations, locale);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className={cn(
              "px-2 py-1 border text-[8px] font-black uppercase tracking-wider",
              TYPE_BG[exhibit.type],
              TYPE_COLORS[exhibit.type]
          )}>
            {exhibit.type}
          </div>
          <h2 className="text-sm font-black uppercase italic text-white tracking-tight truncate max-w-[50vw]">
            {trans?.title || "Untitled_Exhibit"}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-zinc-600 uppercase">
            {currentIndex} / {totalCount}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
          >
            <Icon icon="lucide:x" width={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative min-h-0">
        {totalCount > 1 && (
          <button
            onClick={onPrev}
            className="absolute left-2 md:left-4 z-20 w-10 h-10 flex items-center justify-center bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <Icon icon="lucide:chevron-left" width={18} />
          </button>
        )}

        <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
          {exhibit.media?.url ? (
            <img
              src={exhibit.media.url}
              alt={trans?.title || "Exhibit"}
              className="max-h-[80vh] max-w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-zinc-700">
              <Icon icon={TYPE_ICONS[exhibit.type]} width={48} />
              <span className="text-xs font-mono uppercase tracking-widest">
                No_Visual_Data
              </span>
            </div>
          )}
        </div>

        {totalCount > 1 && (
          <button
            onClick={onNext}
            className="absolute right-2 md:right-4 z-20 w-10 h-10 flex items-center justify-center bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <Icon icon="lucide:chevron-right" width={18} />
          </button>
        )}
      </div>

      {trans?.description && (
        <div className="shrink-0 px-6 py-4 border-t border-zinc-900 bg-zinc-950/80 max-h-[20vh] overflow-y-auto">
          <p className="text-sm text-zinc-400 italic leading-relaxed max-w-2xl mx-auto">
            {trans.description}
          </p>
        </div>
      )}
    </div>
  );
}
