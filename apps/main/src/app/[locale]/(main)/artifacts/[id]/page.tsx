import React from 'react';
import { Icon } from '@iconify/react';
import { BrandIcon } from '@/components/BrandIcon';
import { Badge, cn } from '@shimokitan/ui';
import { MainLayout } from '@/components/layout/MainLayout';
import { getArtifactById, resolveTranslation, getDb } from '@shimokitan/db';
import Link from '@/components/Link';
import { getEntityUrl } from '@shimokitan/utils';
import { notFound } from 'next/navigation';
import { PlayButton } from './PlayButton';
import { StationTrack } from '@/lib/store/station-store';
import { getDictionary, Locale } from '@shimokitan/utils';

import type { Metadata } from 'next';

export async function generateMetadata(props: { params: Promise<{ locale: string, id: string }> }): Promise<Metadata> {
    const { locale, id } = await props.params;
    const artifact = await getArtifactById(id);
    const dict = getDictionary(locale as Locale);
    const s = dict.common.seo;

    if (!artifact) return { title: s.artifact_not_found };

    const translation = resolveTranslation(artifact.translations, locale);
    const title = translation?.title || s.artifact_untitled;
    const description = s.artifact_description.replace('{title}', title);
    const imageUrl = artifact.poster?.url || artifact.thumbnail?.url || "/tokyo.jpg";
    const workTitle = artifact.work ? resolveTranslation(artifact.work.translations, locale)?.title : null;
    const fullTitle = workTitle ? `${title} // ${workTitle}` : title;

    return {
        title: fullTitle,
        description,
        alternates: {
            languages: {
                'en': `/en/artifacts/${artifact.id}`,
                'ja': `/ja/artifacts/${artifact.id}`,
                'id': `/id/artifacts/${artifact.id}`,
            }
        },
        openGraph: {
            title: fullTitle, description,
            images: [{ url: imageUrl, alt: title }],
            type: "music.song"
        },
        twitter: {
            card: "summary_large_image",
            title: fullTitle, description,
            images: [imageUrl]
        }
    };
}

export default async function ArtifactPage(props: { params: Promise<{ locale: string, id: string }> }) {
    const { locale, id } = await props.params;

    const artifact = await getArtifactById(id);
    if (!artifact) notFound();

    const db = getDb();
    const platforms = db ? await db.query.externalPlatforms.findMany() : [];

    const translation = resolveTranslation(artifact.translations, locale);
    const title = translation?.title || "Untitled";
    const description = translation?.description || "";

    const primaryResource = artifact.resources?.find((r: any) => r.isPrimary) || artifact.resources?.[0];

    // ── CREDIT MERGING & DEDUPLICATION ──
    // Merge Work-level credits with Artifact-level credits.
    const rawArtifactCredits = artifact.credits || [];
    const rawWorkCredits = (artifact as any).work?.credits || [];
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
    // Strategy: Strictly separate Heritage (Source IP) from Manifestation (Station/Artifact)
    // We check both the DB flag and semantic role/class to be safe.
    const heritageCredits = allCredits.filter((c: any) => 
        c.isOriginalArtist === true || 
        c.role?.toUpperCase() === 'ORIGINAL' ||
        c.contributorClass === 'author' && (artifact as any).work?.id && c.workId === (artifact as any).work.id
    );

    const manifestationCredits = allCredits.filter((c: any) => {
        // Exclude heritage from manifestation
        const isHeritage = heritageCredits.some(hc => hc.entityId === c.entityId && hc.role === c.role);
        return !isHeritage;
    });

    // Manifestation sub-groups (only for current version creators)
    const stationAuthorCredits = manifestationCredits.filter((c: any) => c.contributorClass === 'author');
    const stationCollaboratorCredits = manifestationCredits.filter((c: any) => c.contributorClass === 'collaborator');
    const stationStaffCredits = manifestationCredits.filter((c: any) => c.contributorClass === 'staff');

    const hasProvenance = artifact.sourceArtifact || artifact.externalOriginal || heritageCredits.length > 0;


    const hostedAudio = artifact.resources?.find((r: any) => r.role === 'hosted_audio');

    const trackData: StationTrack | null = hostedAudio ? {
        title,
        artist: primaryArtistName,
        album: (artifact.work ? resolveTranslation(artifact.work.translations, locale)?.title : null) || artifact.category || "Single",
        cover: artifact.vinyl?.url || artifact.thumbnail?.url || "",
        bitrate: (specs.bitrate as string) || "1411 KBPS",
        format: (specs.format as string) || "LOSSLESS",
        src: hostedAudio.value
    } : null;

    const workTranslation = artifact.work ? resolveTranslation(artifact.work.translations, locale) : null;
    const galleryItems = artifact.media?.filter((m: any) => m.role === 'gallery') || [];

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": artifact.category === 'music' ? 'MusicRecording' : 'CreativeWork',
        "name": title,
        "description": description,
        "image": artifact.poster?.url || artifact.thumbnail?.url || "",
        "author": { "@type": "Person", "name": primaryArtistName },
        "datePublished": artifact.createdAt,
    };

    return (
        <MainLayout>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/*
             * LAYOUT STRATEGY
             * Mobile  (<md):  Single column stack — status ribbon → media → editorial → record panel → provenance
             * Tablet  (md):   2-col: [media+editorial 7cols] | [record+provenance 5cols]
             * Desktop (lg+):  3-col: [record 3] | [media+editorial 5] | [provenance 4]
             */}
            <div className="min-h-[calc(100vh-var(--header-height,48px))] w-full flex flex-col text-white font-mono bg-black">

                {/* ═══════════════════════════════════════════════════════
                    A. STATUS RIBBON
                ══════════════════════════════════════════════════════════ */}
                <div className="shrink-0 border-b border-zinc-800 bg-zinc-950">
                    {/* Mobile: 2x2 grid. Tablet+: 4-col strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-zinc-900">

                        {/* Nature */}
                        <div className="px-4 py-3 flex flex-col justify-center gap-1.5">
                            <span className="text-[10px] text-zinc-600 uppercase tracking-[0.3em]">Nature</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-0.5 h-4 bg-violet-600 shrink-0" />
                                <span className="text-sm font-black italic text-violet-400 uppercase truncate">
                                    {artifact.nature || 'original'}
                                </span>
                            </div>
                        </div>

                        {/* Classification */}
                        <div className="px-4 py-3 flex flex-col justify-center gap-1.5">
                            <span className="text-[10px] text-zinc-600 uppercase tracking-[0.3em]">Classification</span>
                            <span className="text-sm font-black italic text-white uppercase truncate">
                                {artifact.category || 'music'}
                                {artifact.animeType && ` // ${artifact.animeType}`}
                            </span>
                        </div>

                        {/* Signal status */}
                        <div className="px-4 py-3 flex flex-col justify-center gap-1.5">
                            <span className="text-[10px] text-zinc-600 uppercase tracking-[0.3em]">Signal_Status</span>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                <span className="text-sm font-black italic text-emerald-400 uppercase truncate">
                                    {(artifact.status || 'the_pit').replace(/_/g, ' ')}
                                </span>
                            </div>
                        </div>

                        {/* Resonance bar */}
                        <div className="px-4 py-3 flex items-center gap-3">
                            <div className="flex flex-col gap-0.5 shrink-0">
                                <span className="text-[10px] text-rose-500 uppercase tracking-[0.3em]">Resonance</span>
                                <span className="text-xl font-black italic text-white leading-none">
                                    {artifact.resonance || 0}
                                </span>
                            </div>
                            <div className="flex-1 h-2 bg-zinc-900 border border-zinc-800 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-rose-900 to-rose-500 shadow-[0_0_6px_rgba(225,29,72,0.4)]"
                                    style={{ width: `${Math.min(100, Number(artifact.resonance || 0) * 1.33)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════
                    MAIN CONSOLE
                    Mobile:  stacked
                    Tablet:  2-col (md:grid-cols-12)
                    Desktop: 3-col (lg:grid-cols-12)
                ══════════════════════════════════════════════════════════ */}
                <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:divide-x lg:divide-zinc-900">

                    {/* ── B. RECORD PANEL ───────────────────────────────
                        Mobile/Tablet: shown below media (reordered via order-*)
                        Desktop: left column (3 cols)
                    ─────────────────────────────────────────────────── */}
                    <div className="order-3 lg:order-none lg:col-span-3 flex flex-col border-t lg:border-t-0 border-zinc-900">

                        <PanelHeader label="Record_Panel" dot />

                        <div className="flex flex-col divide-y divide-zinc-900">

                            {/* Category & Status handled elsewhere or removed per request */}
                            
                            {artifact.work && (
                                <div className="flex flex-col shrink-0 overflow-hidden border-b border-zinc-900">
                                    <div className="bg-violet-600 px-4 py-2.5 flex items-center gap-2">
                                        <Icon icon="lucide:anchor" width={14} className="text-violet-950" />
                                        <span className="text-[10px] text-violet-950 font-black uppercase tracking-[0.2em]">Master_IP_Anchor</span>
                                    </div>
                                    <div className="bg-zinc-950/40 p-4 py-6 flex flex-col gap-5 relative">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-2xl font-black italic text-white uppercase leading-none tracking-tighter">
                                                {workTranslation?.title}
                                            </span>
                                            <span className="text-[9px] text-violet-500 font-bold uppercase tracking-[0.3em] opacity-80">Canonical_Identity</span>
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

                            {/* Specs */}
                            {hasSpecs && (
                                <div className="px-4 py-4 flex flex-col gap-3 shrink-0">
                                    <div className="flex items-center gap-1.5">
                                        <Icon icon="lucide:sliders-horizontal" width={12} className="text-zinc-600 shrink-0" />
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-[0.35em] font-black">Specifications</span>
                                    </div>
                                    {/* Mobile: 3-col grid for specs. Desktop: 2-col */}
                                    <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-2 gap-x-3 gap-y-3">
                                        {Object.entries(specs).map(([key, value]) => {
                                            let displayValue =
                                                typeof value === 'boolean' ? (value ? 'YES' : 'NO') : String(value);
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

                            {/* Tags */}
                            {artifact.tags && artifact.tags.length > 0 && (
                                <div className="px-4 py-4 flex flex-col gap-3 shrink-0">
                                    <div className="flex items-center gap-1.5">
                                        <Icon icon="lucide:tag" width={12} className="text-zinc-600 shrink-0" />
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-[0.35em] font-black">Tags</span>
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

                            {/* Gateway links */}
                            {artifact.resources && artifact.resources.length > 0 && (
                                <div className="px-4 py-4 flex flex-col gap-3 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <Icon icon="lucide:link" width={12} className="text-zinc-600 shrink-0" />
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.35em] font-black">Gateway_Links</span>
                                        </div>
                                        <span className="text-[9px] text-zinc-700 animate-pulse hidden md:block">UPLINK_STABLE</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {artifact.resources.map((res: any, i: number) => {
                                            const platform = platforms.find(p => p.id === res.platform);
                                            const platformName = platform?.name || res.platform.replace(/_/g, ' ');

                                            return (
                                                <a
                                                    key={i}
                                                    href={res.value}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between px-3 py-2.5 bg-zinc-900/40 border border-zinc-800 hover:border-violet-500/40 hover:bg-zinc-900 transition-all group/gate"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <BrandIcon
                                                            platform={res.platform}
                                                            className="text-zinc-600 group-hover/gate:text-violet-400 shrink-0"
                                                            width={14}
                                                            height={14}
                                                            fallbackIcon={res.platform === 'r2_hosted' ? 'lucide:box' : undefined}
                                                        />
                                                        <span className="text-xs font-black text-zinc-400 group-hover/gate:text-white uppercase tracking-tight transition-colors truncate">
                                                            {platformName}
                                                        </span>
                                                    </div>
                                                    <Icon icon="lucide:external-link" width={12} className="text-zinc-800 group-hover/gate:text-violet-500 shrink-0" />
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── C+D. MEDIA HUB + EDITORIAL ANALYSIS + ECHO FLUX ─
                        Mobile/Tablet: first in flow (order-1)
                        Desktop: middle 5 cols
                    ─────────────────────────────────────────────────── */}
                    <div className="order-1 lg:order-none lg:col-span-5 flex flex-col">

                        <PanelHeader
                            label="Media_Hub"
                            right={
                                <div className="flex items-center gap-4">
                                    {trackData && (
                                        <PlayButton
                                            track={trackData}
                                            className="flex items-center gap-2 text-[10px] font-black text-rose-500 hover:text-white transition-all px-2.5 py-1 border border-rose-500/40 uppercase tracking-widest bg-rose-500/5"
                                        />
                                    )}
                                    <span className="text-[8px] text-zinc-700 uppercase tracking-widest hidden md:block">
                                        SIGNAL_LOCK // {(artifact as any).isHosted ? 'HOSTED' : 'OFFLINE'}
                                    </span>
                                </div>
                            }
                        />

                        {/* Title strip */}
                        <div className="shrink-0 px-4 py-4 md:py-3 border-b border-zinc-900 bg-zinc-950/60 overflow-hidden">
                            <h1 className="text-xl md:text-lg font-black uppercase italic leading-tight text-white tracking-tight">
                                {title}
                            </h1>
                            {workTranslation && (
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold">From</span>
                                    <span className="text-[10px] text-violet-400 uppercase tracking-[0.2em] font-black italic">{workTranslation.title}</span>
                                </div>
                            )}
                        </div>

                        {/* Media — aspect-video */}
                        <div className="shrink-0 relative w-full aspect-video bg-black overflow-hidden">
                            <div className="absolute inset-0 opacity-20 filter blur-3xl saturate-200 pointer-events-none scale-110 z-0">
                                <img src={artifact.thumbnail?.url || undefined} className="w-full h-full object-cover" />
                            </div>

                            {primaryResource?.platform === 'youtube' ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${primaryResource.value.includes('v=')
                                        ? primaryResource.value.split('v=')[1].split('&')[0]
                                        : primaryResource.value.split('/').pop()
                                        }`}
                                    className="absolute inset-0 w-full h-full border-0 z-10"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <img src={artifact.thumbnail?.url || undefined} className="w-full h-full object-cover opacity-60 mix-blend-screen" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                </div>
                            )}

                            {/* HUD cage corners */}
                            <div className="absolute inset-0 z-20 pointer-events-none">
                                <div className="absolute top-2 left-2 border-t border-l border-violet-500/40 w-5 h-5" />
                                <div className="absolute top-2 right-2 border-t border-r border-violet-500/40 w-5 h-5" />
                                <div className="absolute bottom-2 left-2 border-b border-l border-violet-500/30 w-5 h-5" />
                                <div className="absolute bottom-2 right-2 border-b border-r border-violet-500/30 w-5 h-5" />
                                
                                <div className="absolute bottom-2 right-4 flex items-center gap-4 text-[8px] font-mono text-zinc-700 uppercase tracking-widest hidden md:flex">
                                    {galleryItems.length > 0 && <span>ASSETS:{galleryItems.length + 1}</span>}
                                    <span>X:1920 Y:1080</span>
                                </div>
                            </div>
                        </div>

                        {/* Gallery strip (if exists) */}
                        {galleryItems.length > 0 && (
                            <div className="shrink-0 flex gap-2 p-2 border-b border-zinc-900 bg-zinc-950/20 overflow-x-auto scrollbar-none">
                                {[artifact.thumbnail, artifact.poster, ...galleryItems.map((gi: any) => gi.media)].filter(Boolean).map((img: any, i: number) => (
                                    <div key={i} className="shrink-0 h-12 aspect-[2/3] md:h-16 bg-zinc-900 border border-zinc-800 overflow-hidden group/thumb cursor-pointer">
                                        <img src={img.url} className="w-full h-full object-cover grayscale opacity-50 group-hover/thumb:grayscale-0 group-hover/thumb:opacity-100 transition-all scale-110 group-hover/thumb:scale-100" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── EDITORIAL ANALYSIS — PRIORITIZED ──
                            On desktop: fills remaining height with scroll
                            On mobile/tablet: natural height, fully visible
                        ────────────────────────────────────────────── */}
                        <div className="shrink-0 border-t border-zinc-900 px-4 pt-4 pb-8 flex flex-col gap-3">
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="w-0.5 h-4 bg-violet-600 shrink-0" />
                                <span className="text-xs text-violet-500 uppercase tracking-[0.35em] font-black">Editorial_Analysis</span>
                            </div>
                            {description ? (
                                <p className="text-sm md:text-base text-zinc-200 italic leading-relaxed tracking-tight whitespace-pre-wrap">
                                    {description}
                                </p>
                            ) : (
                                <span className="text-[10px] text-zinc-700 uppercase tracking-widest italic">
                                    ANALYSIS_PENDING // VACUUM_STATE
                                </span>
                            )}
                        </div>

                        {/* ── EXHIBIT_ROOT — Supplementary Materials ── */}
                        {(artifact.exhibits && artifact.exhibits.length > 0) && (
                            <div className="flex flex-col border-t border-zinc-900 pb-12">
                                <PanelHeader
                                    label="Exhibit_Root"
                                    icon="lucide:archive"
                                    right={
                                        <Badge variant="clean" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20 uppercase tracking-widest">
                                            Archived:{artifact.exhibits.length}
                                        </Badge>
                                    }
                                />
                                
                                <div className="flex flex-col divide-y divide-zinc-900/60 transition-all">
                                    {artifact.exhibits.sort((a, b) => ((a.position || 0) - (b.position || 0))).map((exhibit: any) => {
                                        const exTrans = resolveTranslation(exhibit.translations, locale);
                                        return (
                                            <div key={exhibit.id} className="p-6 md:p-8 flex flex-col md:flex-row gap-6 hover:bg-zinc-950/40 transition-colors group/exhibit">
                                                {/* Exhibit Visual/Media */}
                                                <div className="w-full md:w-1/3 aspect-video md:aspect-[4/3] bg-zinc-900 border border-zinc-800 overflow-hidden relative shadow-lg">
                                                    {exhibit.media?.url ? (
                                                        <img src={exhibit.media.url} alt={exTrans?.title} className="w-full h-full object-cover group-hover/exhibit:scale-105 transition-transform duration-500" />
                                                    ) : exhibit.type === 'trailer' && exhibit.url ? (
                                                        <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                                                            <Icon icon="lucide:play-circle" width={48} className="text-zinc-800 group-hover/exhibit:text-rose-600 transition-colors" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                                                                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest leading-none">External_Trailer_Source</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Icon icon="lucide:file-text" width={32} className="text-zinc-800" />
                                                        </div>
                                                    )}
                                                    
                                                    {/* Exhibit Type Badge */}
                                                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 border border-zinc-800 backdrop-blur-md text-[8px] font-black uppercase tracking-widest text-zinc-400">
                                                        {exhibit.type}
                                                    </div>
                                                </div>

                                                {/* Exhibit Context */}
                                                <div className="flex-1 space-y-4">
                                                    <div className="space-y-1">
                                                        <h4 className="text-xl font-black italic uppercase tracking-tighter text-white leading-tight">
                                                            {exTrans?.title || "Untitled_Exhibit"}
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1 h-3 bg-amber-600" />
                                                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Archival_Supplementary // DATA_STREAMS</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {exTrans?.description && (
                                                        <p className="text-sm md:text-base text-zinc-400 font-serif italic leading-relaxed">
                                                            {exTrans.description}
                                                        </p>
                                                    )}

                                                    {exhibit.url && (
                                                        <a 
                                                            href={exhibit.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-3 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-violet-600/50 hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-all group-hover/exhibit:text-white"
                                                        >
                                                            Access_External_Vault
                                                            <Icon icon="lucide:external-link" width={14} className="text-zinc-600 group-hover/exhibit:text-violet-500" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── ECHO FLUX — HIDDEN on mobile/tablet, visible on desktop ── */}
                        <div className="flex flex-col border-t border-zinc-900 pb-12">
                            <PanelHeader
                                label="Echo_Flux"
                                right={
                                    <Badge variant="clean" className="text-[10px] bg-rose-500/10 text-rose-500 border-rose-500/20">
                                        {artifact.zines?.length || 0}
                                    </Badge>
                                }
                            />

                            <div className="flex flex-col divide-y divide-zinc-900/60 min-h-0">
                                {artifact.zines?.length ? artifact.zines.map((zine: any, idx: number) => (
                                    <div key={zine.id} className="flex gap-3 px-4 py-4 hover:bg-zinc-900/20 transition-colors group/zine shrink-0">
                                        <div className="flex flex-col items-center gap-0.5 shrink-0 pt-1">
                                            <div className="w-px h-2 bg-rose-600/40 group-hover/zine:bg-rose-600 transition-colors" />
                                            <span className="text-[9px] text-zinc-700 tabular-nums">{String(idx + 1).padStart(2, '0')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs md:text-sm text-amber-50/80 font-serif italic leading-snug">
                                                &ldquo;{resolveTranslation(zine.translations, locale)?.content}&rdquo;
                                            </p>
                                            <div className="flex items-center justify-between mt-2 text-[9px] text-zinc-700 uppercase tracking-widest">
                                                <span className="flex items-center gap-1">
                                                    <Icon icon="lucide:user" width={9} />
                                                    {zine.author?.name || 'Resident'}
                                                </span>
                                                <span className="italic">LOG_{new Date(zine.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="px-4 py-8 text-center text-[10px] text-zinc-700 uppercase tracking-widest italic">
                                        NO_ECHOES_DETECTED // VACUUM_STATE
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── E. PROVENANCE TREE ───────────────────────────────
                        Mobile: shown last (order-4)
                        Tablet: right half (order-2, spans 5 cols in md grid)
                        Desktop: right 4 cols
                    ─────────────────────────────────────────────────── */}
                    <div className="order-4 md:order-2 lg:order-none lg:col-span-4 flex flex-col border-t lg:border-t-0 border-zinc-900">

                        <PanelHeader label="Provenance_Tree" icon="lucide:cpu" />

                        <div className="px-3 py-4 flex flex-col gap-5 pb-20">

                            {/* 1. CANON_WORK (IP Anchor - The core of the tree) */}
                            {artifact.work && (
                                <div className="flex flex-col gap-2 relative z-10">
                                    <div className="hidden lg:block absolute -left-[6px] top-[7px] w-2.5 h-2.5 rounded-full bg-zinc-950 border border-violet-700 z-10" />
                                    <div className="flex items-center gap-2 lg:pl-3 mb-0.5">
                                        <Icon icon="lucide:anchor" width={12} className="text-violet-500 shrink-0" />
                                        <span className="text-xs font-black text-violet-500 uppercase tracking-[0.35em]">Intellectual_Property</span>
                                    </div>
                                    <div className="flex flex-col gap-2 lg:pl-2">
                                        <div className="flex items-center gap-3 p-3 bg-violet-950/20 border border-l-0 border-violet-900/30 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-0.5 h-full bg-violet-600 shadow-[0_0_6px_rgba(124,58,237,0.5)]" />
                                            <div className="w-10 h-10 shrink-0 bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center">
                                                {artifact.work.thumbnail?.url
                                                    ? <img src={artifact.work.thumbnail.url} alt={workTranslation?.title || "Work"} className="w-full h-full object-cover grayscale opacity-50 transition-all" />
                                                    : <Icon icon="lucide:cpu" width={14} className="text-violet-700" />
                                                }
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-black text-violet-100 uppercase italic truncate leading-tight">
                                                    {workTranslation?.title}
                                                </div>
                                                <div className="text-[10px] text-violet-500/50 uppercase tracking-widest mt-0.5">MASTER_IDENTITY</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. STATION_AUTHORITY (Manifestation) */}
                            {stationAuthorCredits.length > 0 && (
                                <TreeGroup label="Station_Authority" icon="lucide:star" color="violet" credits={stationAuthorCredits} locale={locale} />
                            )}

                            {/* 3. ANCILLARY_AUTHORITY (Manifestation Support) */}
                            {(stationCollaboratorCredits.length > 0 || stationStaffCredits.length > 0) && (
                                <TreeGroup 
                                    label="Support_Grid" 
                                    icon="lucide:users" 
                                    color="zinc" 
                                    credits={[...stationCollaboratorCredits, ...stationStaffCredits]} 
                                    locale={locale} 
                                />
                            )}

                            {/* Citation Ancestry / External Roots */}
                            {(artifact.sourceArtifact || artifact.externalOriginal) && (
                                <div className="flex flex-col gap-2 relative z-10 opacity-60">
                                    <div className="hidden lg:block absolute -left-[6px] top-[7px] w-2 h-2 rounded-full bg-zinc-950 border border-rose-900 z-10" />
                                    <div className="flex items-center gap-2 lg:pl-3 mb-0.5">
                                        <Icon icon="lucide:history" width={12} className="text-rose-900 shrink-0" />
                                        <span className="text-xs font-black text-rose-900 uppercase tracking-[0.35em]">Citational_Ancestry</span>
                                    </div>
                                    <div className="flex flex-col gap-2 lg:pl-2">
                                        {artifact.sourceArtifact && (
                                            <Link href={`/artifacts/${artifact.sourceArtifact.id}`} className="flex items-center gap-3 p-3 bg-rose-950/20 border border-l-0 border-rose-900/30 hover:bg-rose-900/10 transition-all group/root relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-0.5 h-full bg-rose-600/50" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-black text-rose-100 uppercase italic truncate leading-tight">
                                                        {resolveTranslation(artifact.sourceArtifact.translations, locale)?.title}
                                                    </div>
                                                    <div className="text-[10px] text-rose-500/50 uppercase tracking-widest mt-0.5">LINKED_REGISTRY</div>
                                                </div>
                                            </Link>
                                        )}
                                        {artifact.externalOriginal && (
                                            <div className="flex items-center gap-3 p-3 bg-rose-950/10 border border-l-0 border-rose-900/20 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-0.5 h-full bg-rose-900/50" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-black text-rose-200 uppercase italic truncate leading-tight">{artifact.externalOriginal.title}</div>
                                                    <div className="text-[10px] text-rose-800 uppercase tracking-widest mt-0.5">EXTERNAL_ORIGIN</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </MainLayout>
    );
}

// ── PanelHeader ───────────────────────────────────────────────────────────────
function PanelHeader({ label, icon, dot, right }: {
    label: string;
    icon?: string;
    dot?: boolean;
    right?: React.ReactNode;
}) {
    return (
        <div className="shrink-0 px-3 py-2.5 bg-zinc-950/80 border-b border-zinc-900 flex items-center gap-2">
            {dot && <div className="w-2 h-2 bg-zinc-600 shrink-0" />}
            {icon && <Icon icon={icon} width={13} className="text-zinc-500 shrink-0" />}
            <span className="text-xs text-zinc-400 uppercase tracking-[0.35em] font-black">{label}</span>
            {right && <div className="ml-auto">{right}</div>}
        </div>
    );
}

// ── TreeGroup ─────────────────────────────────────────────────────────────────
function TreeGroup({ label, icon, color, credits, locale }: {
    label: string;
    icon: string;
    color: 'violet' | 'zinc';
    credits: any[];
    locale: string;
}) {
    const labelColor = color === 'violet' ? 'text-violet-500' : 'text-zinc-600';
    const dotBorder = color === 'violet' ? 'border-violet-700' : 'border-zinc-700';

    return (
        <div className="flex flex-col gap-2 relative z-10">
            <div className={cn("hidden lg:block absolute -left-[6px] top-[7px] w-2.5 h-2.5 rounded-full bg-zinc-950 border z-10", dotBorder)} />
            <div className="flex items-center gap-2 lg:pl-3 mb-0.5">
                <Icon icon={icon} width={12} className={cn("shrink-0", labelColor)} />
                <span className={cn("text-xs font-black uppercase tracking-[0.35em]", labelColor)}>{label}</span>
            </div>
            <div className="flex flex-col gap-2 lg:pl-2">
                {credits.sort((a: any, b: any) => a.isPrimary ? -1 : 1).map((credit: any, i: number) => (
                    <CreditRow key={i} credit={credit} locale={locale} isPrimary={credit.isPrimary} />
                ))}
            </div>
        </div>
    );
}

// ── LabelVal ──────────────────────────────────────────────────────────────────
function LabelVal({ label, val }: { label: string, val: any }) {
    if (!val) return null;
    return (
        <div className="px-4 py-4 flex flex-col gap-1.5 shrink-0">
            <span className="text-[10px] text-zinc-600 uppercase tracking-[0.35em] font-black">{label}</span>
            <span className="text-sm font-black italic text-zinc-100 uppercase leading-tight">{String(val)}</span>
        </div>
    );
}

// ── CreditRow ─────────────────────────────────────────────────────────────────
function CreditRow({ credit, locale, isPrimary }: { credit: any; locale: string; isPrimary: boolean }) {
    const name = resolveTranslation(credit.entity?.translations, locale)?.name || "Anon";
    const isEncrypted = credit.entity?.isEncrypted;
    const isOriginal = credit.isOriginalArtist;

    return (
        <Link
            href={credit.entity ? getEntityUrl(credit.entity) : '#'}
            className={cn(
                "flex items-center gap-3 p-3 border border-l-0 transition-all group/item relative overflow-hidden",
                isPrimary
                    ? "bg-zinc-900 border-zinc-700/50 hover:border-violet-500/30"
                    : "bg-zinc-900/30 border-zinc-800/60 hover:border-violet-500/20 hover:bg-zinc-900/50",
                isOriginal && "border-rose-900/30 bg-rose-900/5"
            )}
        >
            {isPrimary && (
                <div className="absolute top-0 left-0 w-0.5 h-full bg-violet-600 shadow-[0_0_6px_rgba(124,58,237,0.4)]" />
            )}
            <div className="w-9 h-9 shrink-0 bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden">
                {credit.entity?.avatar?.url ? (
                    <img src={credit.entity.avatar.url} alt={name} className="w-full h-full object-cover grayscale group-hover/item:grayscale-0 transition-all" />
                ) : (
                    <Icon
                        icon={isEncrypted ? "lucide:lock" : isPrimary ? "lucide:star" : "lucide:user"}
                        width={14}
                        className={cn("text-zinc-700", isPrimary && "text-violet-500")}
                    />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className={cn(
                    "text-sm font-bold uppercase italic truncate leading-tight transition-colors",
                    isPrimary ? "text-white font-black" : "text-zinc-400 group-hover/item:text-zinc-100"
                )}>
                    {name}
                    {isOriginal && (
                        <span className="ml-1 text-[9px] text-rose-500 border border-rose-500/20 px-0.5 not-italic">SRC</span>
                    )}
                </div>
                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5 truncate">
                    {resolveTranslation(credit.translations, locale)?.role || credit.displayRole || credit.role.replace(/_/g, ' ')}
                    {isPrimary && " // PRIMARY"}
                </div>
            </div>
        </Link>
    );
}