
import React from 'react';
import { Icon } from '@iconify/react';
import { BrandIcon } from '@/components/BrandIcon';
import { Badge, cn } from '@shimokitan/ui';
import Link from '@/components/Link';
import { getEntityUrl } from '@shimokitan/utils';
import { PlayButton } from './PlayButton';
import { ExhibitGallery } from './ExhibitGallery';
import { TheaterPlayer } from './TheaterPlayer';
import { TheaterVideo } from '@/lib/store/theater-store';
import { StationTrack } from '@/lib/store/station-store';
import { Locale, resolveTranslation, getMediaByRole } from '@shimokitan/utils';
import { CompactPulse } from './PulseShards';

interface ArtifactDetailViewProps {
    artifact: any;
    dict: any;
    locale: string;
    exhibitId?: string;
    reactions: any[];
    userReactionTypes: string[];
    reactionCounts: Record<string, number>;
    platforms: any[];
    initialVideo: TheaterVideo | null;
    isExhibitView?: boolean;
    portfolio?: any[];
}

export function ArtifactDetailView({
    artifact,
    dict,
    locale,
    exhibitId,
    reactions,
    userReactionTypes,
    reactionCounts,
    platforms,
    initialVideo,
    isExhibitView,
    portfolio = []
}: ArtifactDetailViewProps) {
    const translation = resolveTranslation(artifact.translations, locale);
    const workTranslation = resolveTranslation(artifact.work?.translations, locale);
    
    // Fallback order: Artifact Title -> Work Title -> Category name -> Default "Untitled"
    const title = translation?.title || workTranslation?.title || (artifact.category === 'illustration' ? 'ILLUSTRATION' : "Untitled");
    const description = translation?.description || workTranslation?.description || "";

    const primaryResource = artifact.resources?.find((r: any) => r.isPrimary) || artifact.resources?.[0];

    // ── CREDIT MERGING & DEDUPLICATION ──
    const rawArtifactCredits = artifact.credits || [];
    const rawWorkCredits = artifact.work?.credits || [];
    const mergedCreditsMap = new Map();
    [...rawWorkCredits, ...rawArtifactCredits].forEach((c: any) => {
        const key = `${c.entityId}-${c.role}`;
        mergedCreditsMap.set(key, c);
    });
    const allCredits = Array.from(mergedCreditsMap.values());

    const primaryCredit =
        allCredits.find((c: any) => c.isPrimary && c.contributorClass === 'author') ||
        allCredits.find((c: any) => c.isPrimary) ||
        allCredits[0];
    const primaryEntity = primaryCredit?.entity;
    const primaryArtistName = resolveTranslation(primaryEntity?.translations, locale)?.name || "ANONYMOUS_SOURCE";

    const specs = (artifact.specs as Record<string, any>) || {};
    const hasSpecs = Object.keys(specs).length > 0;

    // ── CREDIT CATEGORIZATION ──
    const heritageCredits = allCredits.filter((c: any) => 
        c.isOriginalArtist === true || 
        c.role?.toUpperCase() === 'ORIGINAL' ||
        (c.contributorClass === 'author' && artifact.work?.id && c.workId === artifact.work.id)
    );

    const manifestationCredits = allCredits.filter((c: any) => {
        const isHeritage = heritageCredits.some(hc => hc.entityId === c.entityId && hc.role === c.role);
        return !isHeritage;
    });

    const stationAuthorCredits = manifestationCredits.filter((c: any) => c.contributorClass === 'author');
    const stationCollaboratorCredits = manifestationCredits.filter((c: any) => c.contributorClass === 'collaborator');
    const stationStaffCredits = manifestationCredits.filter((c: any) => c.contributorClass === 'staff');

    const hostedAudio = artifact.resources?.find((r: any) => r.role === 'hosted_audio');

    const thumbnail = getMediaByRole(artifact.media, 'thumbnail');
    const gateway = getMediaByRole(artifact.media, 'NETWORK_GATEWAYS');
    const vinyl = getMediaByRole(artifact.media, 'vinyl');
    const poster = getMediaByRole(artifact.media, 'poster');
    const header = getMediaByRole(artifact.media, 'header');

    const isDatabaseStyle = !isExhibitView && (artifact.category === 'anime' || artifact.category === 'game');
    const isIllustrationStyle = !isExhibitView && artifact.category === 'illustration';

    const trackData: StationTrack | null = hostedAudio ? {
        title,
        artist: primaryArtistName,
        album: (artifact.work ? resolveTranslation(artifact.work.translations, locale)?.title : null) || artifact.category || "Single",
        cover: vinyl?.url || gateway?.url || thumbnail?.url || "",
        bitrate: (specs.bitrate as string) || "1411 KBPS",
        format: (specs.format as string) || "LOSSLESS",
        src: hostedAudio.value
    } : null;

    const galleryItems = artifact.media?.filter((m: any) => m.role === 'gallery') || [];

    const groupedResources = (artifact.resources || []).reduce((acc: Record<string, any[]>, res: any) => {
        const platform = platforms.find(p => p.id === res.platform);
        const category = platform?.category || (res.role === 'social' ? 'social' : 'other');
        if (!acc[category]) acc[category] = [];
        acc[category].push({ ...res, platformData: platform });
        return acc;
    }, {});

    const categoryOrder = ['video', 'audio', 'social', 'commerce', 'other'];
    const sortedCategories = Object.keys(groupedResources).sort((a, b) => {
        const idxA = categoryOrder.indexOf(a);
        const idxB = categoryOrder.indexOf(b);
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": artifact.category === 'music' ? 'MusicRecording' : 'CreativeWork',
        "name": title,
        "description": description,
        "image": artifact.media?.find((m: any) => m.role === 'poster')?.media?.url || thumbnail?.url || "",
        "author": { "@type": "Person", "name": primaryArtistName },
        "datePublished": artifact.createdAt,
    };

    // Unified Zine stream: show all artifact zines, possibly sorted by relevance or resonance
    const filteredZines = (artifact.zines || []);

    return (
        <div className="min-h-[calc(100vh-var(--header-height,48px))] w-full flex flex-col text-white font-mono bg-black">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {!isDatabaseStyle && !isIllustrationStyle && (
                <div className="shrink-0 border-b border-zinc-800 bg-zinc-950">
                    <div className={cn("grid divide-x divide-y md:divide-y-0 divide-zinc-900", "grid-cols-2 md:grid-cols-4")}>
                        {!isIllustrationStyle && (
                            <div className="px-4 py-3 flex flex-col justify-center gap-1.5">
                                <span className="text-[10px] text-zinc-600 uppercase tracking-[0.3em]">{dict.discovery.nature}</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-0.5 h-4 bg-violet-600 shrink-0" />
                                    <span className="text-sm font-black italic text-violet-400 uppercase truncate">
                                        {artifact.nature || 'original'}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="px-4 py-3 flex flex-col justify-center gap-1.5">
                            <span className="text-[10px] text-zinc-600 uppercase tracking-[0.3em]">{dict.discovery.classification}</span>
                            <span className="text-sm font-black italic text-white uppercase truncate">
                                {artifact.category || 'music'}
                                {artifact.animeType && ` // ${artifact.animeType}`}
                            </span>
                        </div>

                        <div className="px-4 py-3 flex flex-col justify-center gap-1.5 overflow-hidden">
                            <span className="text-[10px] text-zinc-600 uppercase tracking-[0.3em]">{dict.discovery.pulse_field}</span>
                            <CompactPulse 
                                artifactId={artifact.id} 
                                userReactions={userReactionTypes as any} 
                                counts={reactionCounts as any} 
                                zineCount={filteredZines.length}
                                exhibitId={exhibitId}
                                category={artifact.category}
                            />
                        </div>

                        <div className="px-4 py-3 flex items-center gap-3 overflow-hidden">
                            <div className="flex flex-col gap-0.5 shrink-0">
                                <span className="text-[10px] text-rose-500 uppercase tracking-[0.3em]">{dict.discovery.heat}</span>
                                <span className="text-xl font-black italic text-white leading-none">
                                    {artifact.resonance || 0}
                                </span>
                            </div>
                            <div className="flex-1 h-1.5 bg-zinc-900 border border-zinc-800 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-rose-900 to-rose-500 shadow-[0_0_6px_rgba(225,29,72,0.4)]"
                                    style={{ width: `${Math.min(100, Number(artifact.resonance || 0) * 0.5)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:divide-x lg:divide-zinc-900">
                {/* ── LEFT SIDEBAR ── */}
                {!isExhibitView && !isIllustrationStyle && (
                <div className={cn("lg:order-none lg:col-span-3 flex flex-col border-t lg:border-t-0 border-zinc-900", isDatabaseStyle ? "order-1" : "order-3")}>
                    {isDatabaseStyle ? (
                        <>
                            <div className="relative border-b border-zinc-900 overflow-hidden">
                                {/* Header banner */}
                                <div className="relative w-full aspect-[16/7] bg-zinc-900 overflow-hidden">
                                    {(header?.url || gateway?.url || thumbnail?.url) ? (
                                        <img
                                            src={header?.url || gateway?.url || thumbnail?.url}
                                            alt="Header_Banner"
                                            className="w-full h-full object-cover opacity-60"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-zinc-950" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40" />
                                </div>

                                {/* Poster overlaid on header */}
                                <div className="relative -mt-24 px-4 pb-4 flex flex-col items-center">
                                    <div className="w-32 aspect-[2/3] bg-zinc-900 border-2 border-zinc-800 overflow-hidden shadow-2xl shadow-black/60 group/poster">
                                        {poster?.url || thumbnail?.url ? (
                                            <img src={poster?.url || thumbnail?.url} className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-500" alt="Identity_Poster" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Icon icon="lucide:image" width={28} className="text-zinc-800" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Title + classification below poster */}
                            <div className="px-4 py-4 border-b border-zinc-900 bg-zinc-950/60 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-black uppercase italic leading-none text-white tracking-tighter">
                                        {title}
                                    </h1>
                                    <div className="px-2 py-0.5 bg-rose-500 text-black text-[9px] font-black uppercase tracking-widest skew-x-[-12deg] shrink-0">
                                        Verified
                                    </div>
                                </div>
                                {workTranslation && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold">Origin_Source:</span>
                                        <span className="text-[10px] text-violet-400 uppercase tracking-[0.2em] font-black italic truncate">{workTranslation.title}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em]">{dict.discovery.classification}</span>
                                    <span className="text-[10px] font-black text-zinc-400 uppercase italic tracking-tighter">
                                        {artifact.category} // {artifact.animeType || artifact.gameType || 'ARCHIVAL'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="p-4 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] text-rose-500 font-black uppercase tracking-[0.3em]">{dict.discovery.heat}</span>
                                    <span className="text-2xl font-black italic text-white leading-none">{artifact.resonance || 0}</span>
                                </div>
                                <div className="flex flex-col gap-1 items-end">
                                    <span className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.3em]">{dict.discovery.nature}</span>
                                    <span className="text-xs font-black text-rose-500 uppercase italic">{artifact.nature || 'original'}</span>
                                </div>
                            </div>

                            {/* Memory Resonance */}
                            <div className="px-4 py-4 border-b border-zinc-900 bg-zinc-950/20">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-3.5 bg-violet-600 shrink-0" />
                                        <span className="text-[10px] text-violet-400 uppercase tracking-[0.35em] font-black">Memory_Resonance</span>
                                    </div>
                                    <CompactPulse 
                                        artifactId={artifact.id} 
                                        userReactions={userReactionTypes as any} 
                                        counts={reactionCounts as any} 
                                        zineCount={filteredZines.length}
                                        exhibitId={exhibitId}
                                        category={artifact.category}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <PanelHeader label={dict.discovery.record_panel} dot />
                    )}

                    <div className="flex flex-col divide-y divide-zinc-900">
                        {artifact.work && (
                            <div className="flex flex-col shrink-0 overflow-hidden border-b border-zinc-900">
                                <div className="bg-violet-600 px-4 py-2.5 flex items-center gap-2">
                                    <Icon icon="lucide:anchor" width={14} className="text-violet-950" />
                                    <span className="text-[10px] text-violet-950 font-black uppercase tracking-[0.2em]">{dict.discovery.master_ip_anchor}</span>
                                </div>
                                <div className="bg-zinc-950/40 p-4 py-6 flex flex-col gap-5 relative">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-2xl font-black italic text-white uppercase leading-none tracking-tighter">
                                            {workTranslation?.title}
                                        </span>
                                        <span className="text-[9px] text-violet-500 font-bold uppercase tracking-[0.3em] opacity-80">{dict.discovery.canonical_identity}</span>
                                    </div>

                                    {heritageCredits.length > 0 && (
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-col gap-3.5">
                                                {heritageCredits.map((c: any, i: number) => {
                                                    const name = resolveTranslation(c.entity?.translations, locale)?.name || "ANON";
                                                    return (
                                                        <div key={i} className="flex flex-col gap-1.5">
                                                            <Link href={getEntityUrl(c.entity)} className="text-lg font-black italic uppercase text-violet-200 hover:text-white transition-colors truncate leading-tight">
                                                                {name}
                                                            </Link>
                                                            <div className="flex items-center gap-2">
                                                                <div className="px-1.5 py-0.5 bg-violet-600/10 border border-violet-500/20 text-[8px] text-violet-400 font-black uppercase tracking-widest leading-none">
                                                                    {resolveTranslation(c.translations, locale)?.role || c.role || "ORIGIN"}
                                                                </div>
                                                                <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.1em]">Heritage_Root</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {hasSpecs && (
                            <div className="px-4 py-4 flex flex-col gap-3 shrink-0">
                                <div className="flex items-center gap-1.5">
                                    <Icon icon="lucide:sliders-horizontal" width={12} className="text-zinc-600 shrink-0" />
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-[0.35em] font-black">Specifications</span>
                                </div>
                                <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-2 gap-x-3 gap-y-3">
                                    {Object.entries(specs).map(([key, value]) => {
                                        let displayValue = typeof value === 'boolean' ? (value ? 'YES' : 'NO') : String(value);
                                        if (key === 'durationMs' && typeof value === 'number') {
                                            const mins = Math.floor(value / 60000);
                                            const secs = Math.floor((value % 60000) / 1000);
                                            displayValue = `${mins}:${secs.toString().padStart(2, '0')}`;
                                        }
                                        return (
                                            <div key={key} className="flex flex-col gap-0.5 border-l border-zinc-800 pl-2.5">
                                                <span className="text-[9px] text-zinc-700 uppercase tracking-[0.15em] truncate">
                                                    {key.replace(/([A-Z])/g, '_$1')}
                                                </span>
                                                <span className="text-xs font-black uppercase text-zinc-300 truncate">
                                                    {displayValue}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {artifact.tags && artifact.tags.length > 0 && (
                            <div className="px-4 py-4 flex flex-col gap-3 shrink-0">
                                <div className="flex items-center gap-1.5">
                                    <Icon icon="lucide:tag" width={12} className="text-zinc-600 shrink-0" />
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-[0.35em] font-black">{dict.discovery.tags}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {artifact.tags.map((at: any, i: number) => (
                                        <span
                                            key={`tag-${i}`}
                                            className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-[10px] font-black text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
                                        >
                                            #{resolveTranslation(at.tag.translations, locale)?.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isDatabaseStyle && description && (
                            <div className="px-4 py-4 flex flex-col gap-3 shrink-0">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-0.5 h-3.5 bg-zinc-700 shrink-0" />
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-[0.35em] font-black">{dict.discovery.editorial_analysis}</span>
                                </div>
                                <p className="text-sm text-zinc-300 italic leading-relaxed tracking-tight whitespace-pre-wrap font-serif opacity-90">
                                    {description}
                                </p>
                            </div>
                        )}

                        {/* Contribution Ledger — in sidebar for database style */}
                        {isDatabaseStyle && (heritageCredits.length > 0 || stationAuthorCredits.length > 0) && (
                            <div className="px-4 py-4 flex flex-col gap-4 shrink-0">
                                <div className="flex items-center gap-1.5">
                                    <Icon icon="lucide:cpu" width={12} className="text-zinc-600 shrink-0" />
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-[0.35em] font-black">Contribution_Ledger</span>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {heritageCredits.length > 0 && (
                                        <ProvenanceGroup
                                            label="Root_Authority"
                                            icon="lucide:crown"
                                            color="rose"
                                            credits={heritageCredits}
                                            locale={locale}
                                        />
                                    )}
                                    {stationAuthorCredits.length > 0 && (
                                        <ProvenanceGroup
                                            label={dict.discovery.core_authority}
                                            icon="lucide:star"
                                            color="violet"
                                            credits={stationAuthorCredits}
                                            locale={locale}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {sortedCategories.length > 0 && (
                            <div className="px-4 py-4 flex flex-col gap-6 shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Icon icon="lucide:link" width={12} className="text-zinc-600 shrink-0" />
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-[0.35em] font-black">{dict.discovery.gateway_uplinks}</span>
                                    </div>
                                </div>
                                {sortedCategories.map(category => (
                                    <div key={category} className="space-y-3">
                                        <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <div className={cn(
                                                "w-1 h-3",
                                                category === 'video' ? "bg-rose-500" :
                                                category === 'audio' ? "bg-sky-500" :
                                                category === 'social' ? "bg-emerald-500" :
                                                category === 'commerce' ? "bg-amber-500" : "bg-zinc-700"
                                            )} />
                                            {category.toUpperCase()}_PORTALS
                                        </h3>
                                        <div className="flex flex-col gap-1.5">
                                            {groupedResources[category].map((res: any, i: number) => {
                                                const platformName = res.platformData?.name || res.platform.replace(/_/g, ' ');
                                                return (
                                                    <a
                                                        key={i}
                                                        href={res.value}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between px-3 py-2 bg-zinc-900/40 border border-zinc-800/60 hover:border-violet-500/40 hover:bg-zinc-900/60 transition-all group/gate"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                                <BrandIcon
                                                                    platform={res.platform}
                                                                    iconUrl={res.platformData?.iconUrl}
                                                                    className="group-hover/gate:text-violet-400 shrink-0"
                                                                    width={13}
                                                                    height={13}
                                                                />
                                                            <span className="text-[11px] font-bold text-zinc-400 group-hover/gate:text-white uppercase tracking-tight transition-colors truncate">
                                                                {platformName}
                                                            </span>
                                                        </div>
                                                        <Icon icon="lucide:external-link" width={11} className="text-zinc-800 group-hover/gate:text-violet-500 shrink-0" />
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                )}

                {/* ── CENTER CONTENT (Dynamic Layout) ── */}
                <div className={cn(
                    "lg:order-none flex flex-col",
                    isExhibitView ? "order-1 lg:col-span-8" :
                    isIllustrationStyle ? "order-1 lg:col-span-9" :
                    isDatabaseStyle ? "order-2 lg:col-span-9" : "order-1 lg:col-span-5"
                )}>
                    {isExhibitView ? (
                        <PanelHeader
                            label="Exhibit_Immersion"
                            right={
                                <div className="flex items-center gap-4">
                                    {trackData && (
                                        <PlayButton
                                            track={trackData}
                                            className="flex items-center gap-2 text-[10px] font-black text-rose-500 hover:text-white transition-all px-2.5 py-1 border border-rose-500/40 uppercase tracking-widest bg-rose-500/5"
                                        />
                                    )}
                                </div>
                            }
                        />
                    ) : (
                        <PanelHeader
                            label={isIllustrationStyle ? "SIGNAL_REDUX" : (isDatabaseStyle ? "ARCHIVAL_RECORDS" : dict.discovery.media_hub)}
                            right={
                                <div className="flex items-center gap-4">
                                    {isIllustrationStyle && (
                                        <div className="flex items-center gap-2 px-2 py-0.5 bg-violet-600/10 border border-violet-500/20 text-[9px] text-violet-400 font-black uppercase tracking-widest leading-none">
                                            LIVE_SIGNAL
                                        </div>
                                    )}
                                    {trackData && (
                                        <PlayButton
                                            track={trackData}
                                            className="flex items-center gap-2 text-[10px] font-black text-rose-500 hover:text-white transition-all px-2.5 py-1 border border-rose-500/40 uppercase tracking-widest bg-rose-500/5"
                                        />
                                    )}
                                </div>
                            }
                        />
                    )}

                    {/* Exhibit: Video Player (YouTube-style, no extra chrome) */}
                    {isExhibitView && (
                        <div className="shrink-0 relative w-full aspect-video bg-black overflow-hidden border-b border-zinc-900/50">
                            <TheaterPlayer 
                                initialVideo={initialVideo} 
                                defaultThumbnail={gateway?.url || thumbnail?.url} 
                            />
                        </div>
                    )}

                    {/* Exhibit: Title + reactions below player */}
                    {isExhibitView && (
                        <div className="shrink-0 px-4 py-4 border-b border-zinc-900 bg-zinc-950/40 flex flex-col gap-3">
                            <h1 className="text-lg md:text-xl font-black uppercase italic leading-none text-white tracking-tighter">
                                {(() => {
                                    const exhibit = artifact.exhibits?.find((e: any) => e.id === exhibitId);
                                    if (!exhibit) return 'Untitled_Exhibit';
                                    return resolveTranslation(exhibit.translations, locale)?.title || 'Untitled_Exhibit';
                                })()}
                            </h1>
                            <div className="flex items-center gap-3">
                                <CompactPulse 
                                    artifactId={artifact.id} 
                                    userReactions={userReactionTypes as any} 
                                    counts={reactionCounts as any} 
                                    zineCount={filteredZines.length}
                                    exhibitId={exhibitId}
                                    category={artifact.category}
                                />
                            </div>
                            {(() => {
                                const exhibitDesc = exhibitId 
                                    ? artifact.exhibits?.find((e: any) => e.id === exhibitId)?.translations?.find((t: any) => t.locale === locale)?.description 
                                    : null;
                                return exhibitDesc ? (
                                    <p className="text-sm text-zinc-400 italic leading-relaxed font-serif">
                                        {exhibitDesc}
                                    </p>
                                ) : null;
                            })()}
                        </div>
                    )}

                    {/* Standard title bar for non-database, non-exhibit */}
                    {!isDatabaseStyle && !isExhibitView && (
                        <div className="shrink-0 px-4 py-4 md:py-6 border-b border-zinc-900 bg-zinc-950/60 overflow-hidden flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl md:text-3xl font-black uppercase italic leading-none text-white tracking-tighter">
                                    {title}
                                </h1>
                            </div>
                            {workTranslation && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold">Origin_Source:</span>
                                    <span className="text-[11px] text-violet-400 uppercase tracking-[0.2em] font-black italic">{workTranslation.title}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {!isDatabaseStyle && !isExhibitView && (
                        <div className={cn(
                            "shrink-0 relative w-full bg-black overflow-hidden border-b border-zinc-900/50 flex items-center justify-center",
                            isIllustrationStyle ? "min-h-[60vh] lg:min-h-[80vh] max-h-[90vh]" : "aspect-video"
                        )}>
                            {isIllustrationStyle ? (
                                <>
                                    {/* Ambient Backdrop */}
                                    <div className="absolute inset-0 z-0 select-none pointer-events-none opacity-40 blur-3xl scale-110">
                                        <img 
                                            src={gateway?.url || poster?.url || thumbnail?.url} 
                                            className="w-full h-full object-cover" 
                                            alt=""
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 z-1" />
                                    
                                    {/* Main Canvas */}
                                    <img 
                                        src={gateway?.url || poster?.url || thumbnail?.url} 
                                        className="relative z-10 max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(0,0,0,0.8)] transition-all duration-700" 
                                        alt={title}
                                    />

                                    {/* Canvas Actions Overlay */}
                                    <div className="absolute bottom-6 right-6 z-20 flex gap-2">
                                        <a 
                                            href={gateway?.url || poster?.url || thumbnail?.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all group"
                                            title="View_Raw_Signal"
                                        >
                                            <Icon icon="lucide:maximize" width={18} className="group-hover:scale-110 transition-transform" />
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <TheaterPlayer 
                                    initialVideo={initialVideo} 
                                    defaultThumbnail={gateway?.url || thumbnail?.url} 
                                />
                            )}
                        </div>
                    )}                    {isIllustrationStyle && (
                        <div className="shrink-0 px-6 py-6 border-b border-zinc-900 bg-zinc-950/40 flex flex-col gap-6">
                            {/* Interaction Row */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <CompactPulse 
                                        artifactId={artifact.id} 
                                        userReactions={userReactionTypes as any} 
                                        counts={reactionCounts as any} 
                                        zineCount={filteredZines.length}
                                        category={artifact.category}
                                        className="scale-110 origin-left"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-[11px] font-black uppercase tracking-widest transition-all">
                                        <Icon icon="lucide:share-2" width={14} />
                                        SHARE
                                    </button>
                                </div>
                            </div>

                            {/* Info Content */}
                            <div className="flex flex-col gap-3">
                                <h1 className="text-2xl md:text-3xl font-black uppercase italic leading-none text-white tracking-tighter">
                                    {title}
                                </h1>
                                
                                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-600 uppercase tracking-widest font-black">Date:</span>
                                        <span className="text-sm text-zinc-400 font-bold uppercase">{new Date(artifact.createdAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-600 uppercase tracking-widest font-black">Nature:</span>
                                        <span className="text-sm text-violet-400 font-black italic uppercase tracking-wider">{artifact.nature || 'original'}</span>
                                    </div>
                                </div>

                                {description && (
                                    <p className="text-base text-zinc-300 italic leading-relaxed font-serif max-w-2xl mt-2 opacity-80">
                                        {description}
                                    </p>
                                )}

                                {artifact.tags && artifact.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {artifact.tags.map((at: any, i: number) => (
                                            <Link
                                                key={`tag-${i}`}
                                                href={`/gallery?tag=${at.tag.id}`}
                                                className="px-4 py-1.5 bg-zinc-900/60 border border-zinc-800 text-[11px] font-black text-zinc-500 hover:text-violet-400 hover:border-violet-500/50 transition-all uppercase tracking-widest"
                                            >
                                                #{resolveTranslation(at.tag.translations, locale)?.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}                    <div className="flex flex-col divide-y divide-zinc-900">
                        {!isExhibitView && artifact.exhibits && artifact.exhibits.length > 0 && (
                            <ExhibitGallery
                                exhibits={artifact.exhibits}
                                locale={locale}
                                artifactCategory={artifact.category}
                                artifactId={artifact.id}
                                isDatabaseStyle={isDatabaseStyle}
                            />
                        )}

                        {!isDatabaseStyle && !isIllustrationStyle && description && (
                            <div className="px-4 pt-6 pb-12 flex flex-col gap-3">
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-0.5 h-4 bg-zinc-800 shrink-0" />
                                    <span className="text-xs text-zinc-500 uppercase tracking-[0.35em] font-black">{dict.discovery.editorial_analysis}</span>
                                </div>
                                <p className="text-base md:text-lg text-zinc-200 italic leading-relaxed tracking-tight whitespace-pre-wrap font-serif opacity-90">
                                    {description}
                                </p>
                            </div>
                        )}


                    </div>

                    {!isDatabaseStyle && !isExhibitView && galleryItems.length > 0 && (
                        <div className="shrink-0 flex gap-2 p-2 border-b border-zinc-900 bg-zinc-950/20 overflow-x-auto scrollbar-none">
                            {[thumbnail, ...artifact.media?.filter((m: any) => m.role === 'poster').map((m: any) => m.media), ...galleryItems.map((gi: any) => gi.media)].filter(Boolean).map((img: any, i: number) => (
                                <div key={i} className="shrink-0 h-12 aspect-[2/3] md:h-16 bg-zinc-900 border border-zinc-800 overflow-hidden group/thumb cursor-pointer">
                                    <img src={img.url} className="w-full h-full object-cover opacity-60 group-hover/thumb:opacity-100 transition-all" />
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* --- Echo Flux: Pulse Stream --- */}
                    {!isExhibitView && (
                    <div className={cn("shrink-0 border-t border-zinc-900 px-4 pt-8 pb-12 flex flex-col gap-6", isDatabaseStyle ? "bg-black" : "bg-zinc-950/20")}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="w-1.5 h-4 bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.5)] shrink-0" />
                                <span className="text-xs text-rose-500 uppercase tracking-[0.35em] font-black">{dict.discovery.echo_flux}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{dict.discovery.active_signals}</span>
                                <span className="text-[10px] font-black text-rose-500 italic bg-rose-500/10 px-1.5 py-0.5 border border-rose-500/20">
                                    {filteredZines.length || 0}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {filteredZines.length > 0 ? (
                                filteredZines.map((zine: any, idx: number) => {
                                    const zineTrans = resolveTranslation(zine.translations, locale);
                                    return (
                                        <div key={zine.id} className="relative group/zine">
                                            <div className="flex gap-4 p-4 border border-zinc-900 bg-zinc-950/40 hover:border-rose-900/40 hover:bg-rose-950/5 transition-all duration-500">
                                                <div className="flex flex-col items-center shrink-0 pt-1">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center p-0 overflow-hidden shadow-inner shrink-0 leading-none">
                                                        {zine.author?.avatarUrl ? (
                                                            <img src={zine.author.avatarUrl} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Icon icon="lucide:user" className="text-zinc-700" width={14} />
                                                        )}
                                                    </div>
                                                    <div className="w-[1px] flex-1 bg-zinc-800/40 my-2" />
                                                </div>
                                                
                                                <div className="min-w-0 flex-1 flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase italic text-zinc-500 group-hover/zine:text-rose-400 transition-colors">
                                                            {zine.author?.name || 'Resident_Source'}
                                                        </span>
                                                        <div className="flex items-center gap-2.5">
                                                            {zine.exhibit && (
                                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                                                                    <Icon icon="lucide:layers" width={10} className="text-zinc-600" />
                                                                    <span className="text-[8px] font-black uppercase text-zinc-500 truncate max-w-[80px]">
                                                                        {resolveTranslation(zine.exhibit.translations, locale)?.title || 'Exhibit'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1.5">
                                                                <Icon icon="lucide:zap" width={10} className="text-rose-500" />
                                                                <span className="text-[10px] font-black text-rose-500 italic">{zine.resonance || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <p className="text-sm text-zinc-300 leading-relaxed italic font-serif opacity-90 group-hover/zine:opacity-100 transition-opacity">
                                                        &ldquo;{zineTrans?.content || "Signal interference... memory fragment corrupted."}&rdquo;
                                                    </p>
                                                    
                                                    <div className="flex items-center gap-3 mt-1 opacity-40 group-hover/zine:opacity-80 transition-opacity">
                                                        <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">
                                                            Log_Time: {new Date(zine.createdAt).toLocaleDateString().replace(/\//g, '.')}
                                                        </span>
                                                        <span className="text-[8px] font-mono text-rose-800 shadow-sm">// SHARD_{idx.toString().padStart(2, '0')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Decorative vertical line for the "pulse stream" effect */}
                                            {idx !== filteredZines.length - 1 && (
                                                <div className="absolute left-8 top-12 bottom-0 w-[1px] bg-zinc-900 z-0" />
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-8 flex flex-col items-center justify-center gap-3 border border-dashed border-zinc-900 rounded-lg opacity-30 group/empty hover:opacity-100 transition-opacity">
                                    <Icon icon="lucide:message-square-off" width={24} className="text-zinc-600" />
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] font-black mb-1">Zero_Resonance_Detected</span>
                                        <p className="text-[9px] font-mono text-zinc-600 uppercase italic">Waiting for the first echo fragment...</p>
                                    </div>
                                </div>
                            )}
                            
                            <div className="mt-2 flex items-center justify-between px-1">
                                <span className="text-[8px] text-zinc-800 uppercase font-black font-mono tracking-[0.2em]">
                                    COMMUNITY_SIGNAL_OUTPUT // STABLE
                                </span>
                            </div>
                        </div>
                    </div>
                    )}

                    {!isDatabaseStyle && !isExhibitView && artifact.exhibits && artifact.exhibits.length > 0 && (
                        <ExhibitGallery
                            exhibits={artifact.exhibits}
                            locale={locale}
                            artifactCategory={artifact.category}
                            artifactId={artifact.id}
                        />
                    )}
                </div>

                {/* ── EXHIBIT SIDEBAR (YouTube-style right column) ── */}
                {isExhibitView && (
                    <div className="order-2 lg:order-none lg:col-span-4 flex flex-col border-t lg:border-t-0 border-zinc-900">
                        {/* Source Artifact Card */}
                        <Link
                            href={`/artifacts/${artifact.category}/${artifact.id}`}
                            className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-900 bg-zinc-950/60 hover:bg-zinc-900/40 transition-all group/src"
                        >
                            <div className="shrink-0 w-10 aspect-[2/3] bg-zinc-900 border border-zinc-800 overflow-hidden">
                                {(poster?.url || thumbnail?.url) ? (
                                    <img src={poster?.url || thumbnail?.url} className="w-full h-full object-cover" alt="Source" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                                        <Icon icon="lucide:image" width={10} className="text-zinc-800" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">Source_Artifact</span>
                                <span className="text-xs font-black text-white uppercase italic tracking-tighter truncate group-hover/src:text-violet-400 transition-colors">
                                    {title}
                                </span>
                                <span className="text-[9px] text-zinc-700 font-mono uppercase tracking-[0.15em]">
                                    {artifact.category} // {artifact.animeType || artifact.gameType || 'Archival'}
                                </span>
                            </div>
                            <Icon icon="lucide:arrow-right" width={14} className="text-zinc-700 group-hover/src:text-violet-500 shrink-0 transition-colors" />
                        </Link>

                        {/* Other Exhibits */}
                        {artifact.exhibits && artifact.exhibits.length > 1 && (
                            <div className="flex flex-col">
                                <div className="px-3 py-2.5 bg-zinc-950/80 border-b border-zinc-900 flex items-center gap-2">
                                    <Icon icon="lucide:list" width={12} className="text-zinc-600 shrink-0" />
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-black">
                                        Other_Exhibits
                                    </span>
                                    <span className="ml-auto text-[9px] text-zinc-700 font-mono">
                                        {artifact.exhibits.length - 1}
                                    </span>
                                </div>
                                <div className="flex flex-col divide-y divide-zinc-900/60">
                                    {artifact.exhibits
                                        .filter((e: any) => e.id !== exhibitId)
                                        .map((exhibit: any) => {
                                            const eTrans = resolveTranslation(exhibit.translations, locale);
                                            const isVideo = ['trailer', 'opening', 'ending'].includes(exhibit.type);
                                            return (
                                                <Link
                                                    key={exhibit.id}
                                                    href={`/artifacts/${artifact.category}/${artifact.id}/exhibit/${exhibit.id}`}
                                                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-900/40 transition-all group/ex"
                                                >
                                                    <div className="shrink-0 w-20 aspect-video bg-zinc-900 border border-zinc-800/60 overflow-hidden relative">
                                                        {exhibit.media?.url ? (
                                                            <img src={exhibit.media.url} alt={eTrans?.title || 'Exhibit'} className="w-full h-full object-cover opacity-70 group-hover/ex:opacity-100 transition-opacity" />
                                                        ) : (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
                                                                <Icon icon="lucide:play-circle" width={14} className="text-zinc-800" />
                                                            </div>
                                                        )}
                                                        {isVideo && (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                                                                    <Icon icon="lucide:play" width={10} className="text-white ml-px" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                                        <span className="text-[11px] font-black uppercase text-zinc-300 italic tracking-tight truncate leading-none group-hover/ex:text-white transition-colors">
                                                            {eTrans?.title || 'Untitled'}
                                                        </span>
                                                        <span className="text-[9px] text-zinc-700 font-black uppercase tracking-wider">
                                                            {exhibit.type}
                                                        </span>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {!isDatabaseStyle && !isExhibitView && (
                    <div className={cn(
                        "order-4 md:order-2 lg:order-none flex flex-col border-t lg:border-t-0 border-zinc-900",
                        isIllustrationStyle ? "lg:col-span-3" : "lg:col-span-4"
                    )}>
                        {isIllustrationStyle ? (
                            <div className="flex flex-col divide-y divide-zinc-900">
                                {/* Artist Profile Section */}
                                <div className="px-5 py-6 flex flex-col gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-zinc-900 border-2 border-zinc-800 p-0.5 shadow-xl">
                                            {primaryEntity?.avatar?.url ? (
                                                <img src={primaryEntity.avatar.url} className="w-full h-full object-cover" alt={primaryArtistName} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                                                    <Icon icon="lucide:user" width={24} className="text-zinc-800" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <Link href={primaryEntity ? getEntityUrl(primaryEntity) : "#"} className="text-2xl font-black text-white hover:text-violet-400 transition-colors truncate italic">
                                                {primaryArtistName}
                                            </Link>
                                            <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.25em]">ROOT_AUTHORITY</span>
                                        </div>
                                    </div>
                                    
                                    <Link 
                                        href={getEntityUrl(primaryEntity)} 
                                        className="flex items-center justify-center gap-2 w-full py-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-violet-500/50 transition-all text-xs font-black text-white uppercase tracking-widest"
                                    >
                                        <Icon icon="lucide:layout-grid" width={14} />
                                        Full_Portfolio
                                    </Link>
                                </div>

                                {/* Other Artifacts from this Artist (Portfolio) */}
                                {portfolio && portfolio.length > 0 && (
                                    <div className="px-5 py-6 flex flex-col gap-5">
                                        <div className="flex items-center gap-2">
                                            <Icon icon="lucide:layers" width={16} className="text-zinc-600" />
                                            <span className="text-sm font-black text-zinc-500 uppercase tracking-widest leading-none">Catalog_Echo</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {portfolio.map((other: any) => {
                                                const otherThumb = other.media?.find((m: any) => 
                                                    ['thumbnail', 'poster', 'nature', 'NETWORK_GATEWAYS', 'vinyl', 'header'].includes(m.role)
                                                );
                                                return (
                                                    <Link 
                                                        key={other.id} 
                                                        href={`/artifacts/${other.category}/${other.id}`}
                                                        className="aspect-square bg-zinc-900 border-2 border-zinc-800 overflow-hidden group/other hover:border-violet-500 transition-all font-mono"
                                                        title={resolveTranslation(other.translations, locale)?.title || "Source"}
                                                    >
                                                        {otherThumb?.media?.url ? (
                                                            <img src={otherThumb.media.url} className="w-full h-full object-cover opacity-60 group-hover/other:opacity-100 group-hover/other:scale-110 transition-all duration-500" alt="Work" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Icon icon="lucide:image" width={14} className="text-zinc-800" />
                                                            </div>
                                                        )}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Uplinks Block */}
                                {sortedCategories.length > 0 && (
                                    <div className="px-5 py-6 flex flex-col gap-4">
                                        <div className="flex items-center gap-2">
                                            <Icon icon="lucide:link" width={14} className="text-zinc-600" />
                                            <span className="text-xs font-black text-zinc-500 uppercase tracking-widest leading-none">External_Signals</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {sortedCategories.slice(0, 3).map(cat => groupedResources[cat].slice(0, 1).map((res: any, j: number) => (
                                                <a key={`${cat}-${j}`} href={res.value} target="_blank" className="flex items-center gap-4 px-4 py-3 bg-zinc-900/40 border border-zinc-800 hover:border-violet-500/50 transition-all text-xs font-bold text-zinc-400 hover:text-white uppercase">
                                                    <BrandIcon platform={res.platform} width={12} height={12} />
                                                    {res.platformData?.name || res.platform}
                                                </a>
                                            )))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="px-3 py-4 flex flex-col gap-5 pb-20">
                                {heritageCredits.length > 0 && (
                                    <ProvenanceGroup
                                        label="Root_Authority"
                                        icon="lucide:crown"
                                        color="rose"
                                        credits={heritageCredits}
                                        locale={locale}
                                    />
                                )}

                                {stationAuthorCredits.length > 0 && (
                                    <ProvenanceGroup
                                        label={dict.discovery.core_authority}
                                        icon="lucide:star"
                                        color="violet"
                                        credits={stationAuthorCredits}
                                        locale={locale}
                                    />
                                )}

                                {(stationCollaboratorCredits.length > 0 || stationStaffCredits.length > 0) && (
                                    <ProvenanceGroup
                                        label={dict.discovery.collaborative_flux}
                                        icon="lucide:users"
                                        color="zinc"
                                        credits={[...stationCollaboratorCredits, ...stationStaffCredits]}
                                        locale={locale}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function PanelHeader({ label, icon, dot, right }: { label: string; icon?: string; dot?: boolean; right?: React.ReactNode; }) {
    return (
        <div className="shrink-0 px-3 py-2.5 bg-zinc-950/80 border-b border-zinc-900 flex items-center gap-2">
            {dot && <div className="w-2 h-2 bg-zinc-600 shrink-0" />}
            {icon && <Icon icon={icon} width={13} className="text-zinc-500 shrink-0" />}
            <span className="text-xs text-zinc-400 uppercase tracking-[0.35em] font-black">{label}</span>
            {right && <div className="ml-auto">{right}</div>}
        </div>
    );
}

function ProvenanceGroup({ label, icon, color, credits, locale }: {
    label: string; icon: string; color: 'rose' | 'violet' | 'zinc'; credits: any[]; locale: string;
}) {
    const colorMap = {
        rose: 'text-rose-500',
        violet: 'text-violet-500',
        zinc: 'text-zinc-600',
    };
    const labelColor = colorMap[color];

    return (
        <div className="flex flex-col gap-3 relative z-10">
            <div className="flex items-center gap-2 lg:pl-3 mb-0.5">
                <Icon icon={icon} width={14} className={cn("shrink-0", labelColor)} />
                <span className={cn("text-xs font-black uppercase tracking-[0.35em]", labelColor)}>{label}</span>
            </div>
            <div className="flex flex-col gap-2 lg:pl-2">
                {credits.sort((a: any, b: any) => a.isPrimary ? -1 : 1).map((credit: any, i: number) => (
                    <ProvenanceCreditRow key={i} credit={credit} locale={locale} color={color} />
                ))}
            </div>
        </div>
    );
}

function ProvenanceCreditRow({ credit, locale, color }: { credit: any; locale: string; color: 'rose' | 'violet' | 'zinc' }) {
    const name = resolveTranslation(credit.entity?.translations, locale)?.name || "Anon";
    const roleName = resolveTranslation(credit.translations, locale)?.role || credit.role || "ORIGIN";

    const barColorMap = {
        rose: 'bg-rose-600 shadow-[0_0_6px_rgba(225,29,72,0.5)]',
        violet: 'bg-violet-600 shadow-[0_0_6px_rgba(124,58,237,0.5)]',
        zinc: 'bg-zinc-600',
    };
    const bgMap = {
        rose: 'bg-rose-950/20 border-rose-900/30 hover:border-rose-700/50',
        violet: 'bg-violet-950/20 border-violet-900/30 hover:border-violet-700/50',
        zinc: 'bg-zinc-900/30 border-zinc-800/60 hover:border-zinc-700/50',
    };
    const roleColorMap = {
        rose: 'text-rose-400 bg-rose-600/10 border-rose-500/20',
        violet: 'text-violet-400 bg-violet-600/10 border-violet-500/20',
        zinc: 'text-zinc-400 bg-zinc-600/10 border-zinc-500/20',
    };

    return (
        <Link
            href={credit.entity ? getEntityUrl(credit.entity) : '#'}
            className={cn(
                "flex items-center gap-3 p-3 border border-l-0 relative overflow-hidden transition-all",
                bgMap[color]
            )}
        >
            <div className={cn("absolute top-0 left-0 w-0.5 h-full", barColorMap[color])} />
            <div className="w-9 h-9 shrink-0 bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden">
                {credit.entity?.avatar?.url ? (
                    <img src={credit.entity.avatar.url} className="w-full h-full object-cover" />
                ) : (
                    <Icon icon="lucide:user" width={14} className="text-zinc-700" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-base font-black text-zinc-100 uppercase italic truncate leading-tight">{name}</div>
                <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                        "px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest leading-none border",
                        roleColorMap[color]
                    )}>
                        {roleName}
                    </span>
                </div>
            </div>
        </Link>
    );
}
