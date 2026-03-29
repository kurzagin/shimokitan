import React from 'react';
import { Icon } from '@iconify/react';
import { BrandIcon } from '@/components/BrandIcon';
import { Badge, cn } from '@shimokitan/ui';

import { getArtifactById, resolveTranslation, getDb, schema, eq } from '@shimokitan/db';
import Link from '@/components/Link';
import { getEntityUrl } from '@shimokitan/utils';
import { notFound } from 'next/navigation';
import { PlayButton } from './PlayButton';
import { ExhibitGallery } from './ExhibitGallery';
import { TheaterPlayer } from './TheaterPlayer';
import { TheaterVideo } from '@/lib/store/theater-store';
import { StationTrack } from '@/lib/store/station-store';
import { getDictionary, Locale, getMediaByRole } from '@shimokitan/utils';
import { CompactPulse } from './PulseShards';
import { ensureUserSync } from '@/app/[locale]/(pedalboard)/pedalboard/auth-helpers';
import type { Metadata } from 'next';

// Helper removed, using shared version from @shimokitan/utils

export async function generateMetadata(props: { 
    params: Promise<{ locale: string, id: string }>,
    searchParams: Promise<{ exhibit?: string }>
}): Promise<Metadata> {
    const { locale, id } = await props.params;
    const { exhibit: exhibitId } = await props.searchParams;
    const artifact = await getArtifactById(id);
    const dict = getDictionary(locale as Locale);
    const s = dict.common.seo;

    if (!artifact) return { title: s.artifact_not_found };

    const translation = resolveTranslation(artifact.translations, locale);
    const title = translation?.title || (artifact.category === 'illustration' ? 'ILLUSTRATION' : s.artifact_untitled);
    const description = s.artifact_description.replace('{title}', title);
    
    const poster = getMediaByRole(artifact.media, 'poster');
    const thumbnail = getMediaByRole(artifact.media, 'thumbnail');
    const gateway = getMediaByRole(artifact.media, 'NETWORK_GATEWAYS');
    const imageUrl = gateway?.url || poster?.url || thumbnail?.url || "/tokyo.jpg";
    
    const workTitle = artifact.work ? resolveTranslation(artifact.work.translations, locale)?.title : null;
    let fullTitle = workTitle ? `${title} // ${workTitle}` : title;

    if (exhibitId) {
        const exhibit = artifact.exhibits?.find(e => e.id === exhibitId);
        if (exhibit) {
            const exTrans = resolveTranslation(exhibit.translations, locale);
            if (exTrans) {
                fullTitle = `${exTrans.title} _ [ ${fullTitle} ]`;
            }
        }
    }

    return {
        title: fullTitle,
        description,
        alternates: {
            languages: {
                'en': `/en/cinema/${artifact.id}`,
                'ja': `/ja/cinema/${artifact.id}`,
                'id': `/id/id/cinema/${artifact.id}`,
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

export default async function ArtifactPage(props: { 
    params: Promise<{ locale: string, id: string }>,
    searchParams: Promise<{ exhibit?: string }>
}) {
    const { locale, id } = await props.params;
    const { exhibit: exhibitId } = await props.searchParams;
    const dict = getDictionary(locale as Locale);

    const artifact = await getArtifactById(id);
    if (!artifact) notFound();

    const db = getDb();
    const platforms = db ? await db.query.externalPlatforms.findMany() : [];
    
    // ── REACTION FETCHING ──
    const user = await ensureUserSync();
    const reactions = db ? await db.query.artifactReactions.findMany({
        where: eq(schema.artifactReactions.artifactId, id),
    }) : [];
    
    const userReactionTypes = user 
        ? reactions.filter((r: any) => r.authorId === user.id).map((r: any) => r.type)
        : [];
    
    const reactionCounts = reactions.reduce((acc: any, r: any) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
    }, {});

    const translation = resolveTranslation(artifact.translations, locale);
    const title = translation?.title || (artifact.category === 'illustration' ? 'ILLUSTRATION' : "Untitled");
    const description = translation?.description || "";

    const primaryResource = artifact.resources?.find((r: any) => r.isPrimary) || artifact.resources?.[0];

    // ── CREDIT MERGING & DEDUPLICATION ──
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
    const heritageCredits = allCredits.filter((c: any) => 
        c.isOriginalArtist === true || 
        c.role?.toUpperCase() === 'ORIGINAL' ||
        (c.contributorClass === 'author' && (artifact as any).work?.id && c.workId === (artifact as any).work.id)
    );

    const manifestationCredits = allCredits.filter((c: any) => {
        const isHeritage = heritageCredits.some(hc => hc.entityId === c.entityId && hc.role === c.role);
        return !isHeritage;
    });

    const stationAuthorCredits = manifestationCredits.filter((c: any) => c.contributorClass === 'author');
    const stationCollaboratorCredits = manifestationCredits.filter((c: any) => c.contributorClass === 'collaborator');
    const stationStaffCredits = manifestationCredits.filter((c: any) => c.contributorClass === 'staff');

    const hasProvenance = (artifact as any).work || heritageCredits.length > 0;

    const hostedAudio = artifact.resources?.find((r: any) => r.role === 'hosted_audio');

    const poster = getMediaByRole(artifact.media, 'poster');
    const thumbnail = getMediaByRole(artifact.media, 'thumbnail');
    const gateway = getMediaByRole(artifact.media, 'NETWORK_GATEWAYS');
    const vinyl = getMediaByRole(artifact.media, 'vinyl');

    const trackData: StationTrack | null = hostedAudio ? {
        title,
        artist: primaryArtistName,
        album: (artifact.work ? resolveTranslation(artifact.work.translations, locale)?.title : null) || artifact.category || "Single",
        cover: vinyl?.url || gateway?.url || thumbnail?.url || "",
        bitrate: (specs.bitrate as string) || "1411 KBPS",
        format: (specs.format as string) || "LOSSLESS",
        src: hostedAudio.value
    } : null;

    const workTranslation = artifact.work ? resolveTranslation(artifact.work.translations, locale) : null;
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
        "image": poster?.url || thumbnail?.url || "",
        "author": { "@type": "Person", "name": primaryArtistName },
        "datePublished": artifact.createdAt,
    };

    let initialVideo: TheaterVideo | null = null;
    const primaryExhibit = exhibitId 
        ? artifact.exhibits?.find(e => e.id === exhibitId)
        : artifact.exhibits?.find((e: any) => e.isPrimary);
    
    // Initial Video logic - prioritized selection if exhibitId exists
    if (exhibitId && primaryExhibit?.url) {
        let platform: 'youtube' | 'local' | 'unknown' = 'unknown';
        if (primaryExhibit.url.includes('youtube') || primaryExhibit.url.includes('youtu.be')) platform = 'youtube';
        initialVideo = { id: primaryExhibit.id, url: primaryExhibit.url, platform, thumbnailUrl: primaryExhibit.media?.url || thumbnail?.url };
    } else if (primaryResource?.platform === 'youtube') {
        initialVideo = { id: primaryResource.id, url: primaryResource.value, platform: 'youtube', thumbnailUrl: thumbnail?.url };
    } else if (primaryExhibit?.url) {
        let platform: 'youtube' | 'local' | 'unknown' = 'unknown';
        if (primaryExhibit.url.includes('youtube') || primaryExhibit.url.includes('youtu.be')) platform = 'youtube';
        initialVideo = { id: primaryExhibit.id, url: primaryExhibit.url, platform, thumbnailUrl: primaryExhibit.media?.url || thumbnail?.url };
    } else if (artifact.exhibits?.length) {
        const fallbackEx = artifact.exhibits.find((e: any) => ['trailer', 'opening', 'ending'].includes(e.type) && e.url);
        if (fallbackEx && fallbackEx.url) {
            let platform: 'youtube' | 'local' | 'unknown' = 'unknown';
            if (fallbackEx.url.includes('youtube') || fallbackEx.url.includes('youtu.be')) platform = 'youtube';
            initialVideo = { id: fallbackEx.id, url: fallbackEx.url, platform, thumbnailUrl: fallbackEx.media?.url || thumbnail?.url };
        }
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="min-h-[calc(100vh-var(--header-height,48px))] w-full flex flex-col text-white font-mono bg-black">
                <div className="shrink-0 border-b border-zinc-800 bg-zinc-950">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-zinc-900">
                        <div className="px-4 py-3 flex flex-col justify-center gap-1.5">
                            <span className="text-[10px] text-zinc-600 uppercase tracking-[0.3em]">{dict.discovery.nature}</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-0.5 h-4 bg-violet-600 shrink-0" />
                                <span className="text-sm font-black italic text-violet-400 uppercase truncate">
                                    {artifact.nature || 'original'}
                                </span>
                            </div>
                        </div>

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
                                zineCount={(artifact as any).zines?.length}
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

                <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:divide-x lg:divide-zinc-900">
                    <div className="order-3 lg:order-none lg:col-span-3 flex flex-col border-t lg:border-t-0 border-zinc-900">
                        <PanelHeader label={dict.discovery.record_panel} dot />
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

                    <div className="order-1 lg:order-none lg:col-span-5 flex flex-col">
                        <PanelHeader
                            label={dict.discovery.media_hub}
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

                        <div className="shrink-0 relative w-full aspect-video bg-black overflow-hidden border-b border-zinc-900/50">
                            {/* Dynamic Theater Player managed by Client Component */}
                            <TheaterPlayer 
                                initialVideo={initialVideo} 
                                defaultThumbnail={gateway?.url || thumbnail?.url} 
                            />
                        </div>

                        {galleryItems.length > 0 && (
                            <div className="shrink-0 flex gap-2 p-2 border-b border-zinc-900 bg-zinc-950/20 overflow-x-auto scrollbar-none">
                                {[thumbnail, poster, ...galleryItems.map((gi: any) => gi.media)].filter(Boolean).map((img: any, i: number) => (
                                    <div key={i} className="shrink-0 h-12 aspect-[2/3] md:h-16 bg-zinc-900 border border-zinc-800 overflow-hidden group/thumb cursor-pointer">
                                        <img src={img.url} className="w-full h-full object-cover opacity-60 group-hover/thumb:opacity-100 transition-all" />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="shrink-0 border-t border-zinc-900 px-4 pt-4 pb-8 flex flex-col gap-3">
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="w-0.5 h-4 bg-violet-600 shrink-0" />
                                <span className="text-xs text-violet-500 uppercase tracking-[0.35em] font-black">{dict.discovery.editorial_analysis}</span>
                            </div>
                            {description ? (
                                <p className="text-sm md:text-base text-zinc-200 italic leading-relaxed tracking-tight whitespace-pre-wrap">
                                    {description}
                                </p>
                            ) : (
                                <span className="text-[10px] text-zinc-700 uppercase tracking-widest italic">{dict.discovery.analysis_pending}</span>
                            )}
                        </div>

                        {/* --- Echo Flux: Pulse Stream --- */}
                        <div className="shrink-0 border-t border-zinc-900 px-4 pt-6 pb-12 flex flex-col gap-6 bg-zinc-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-1.5 h-4 bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.5)] shrink-0" />
                                    <span className="text-xs text-rose-500 uppercase tracking-[0.35em] font-black">{dict.discovery.echo_flux}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{dict.discovery.active_signals}</span>
                                    <span className="text-[10px] font-black text-rose-500 italic bg-rose-500/10 px-1.5 py-0.5 border border-rose-500/20">
                                        {(artifact as any).zines?.length || 0}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                {((artifact as any).zines || []).length > 0 ? (
                                    (artifact as any).zines.map((zine: any, idx: number) => {
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
                                                        <div className="w-[1px] flex-1 bg-gradient-to-b from-zinc-800 to-transparent my-2" />
                                                    </div>
                                                    
                                                    <div className="min-w-0 flex-1 flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black uppercase italic text-zinc-500 group-hover/zine:text-rose-400 transition-colors">
                                                                {zine.author?.name || 'Resident_Source'}
                                                            </span>
                                                            <div className="flex items-center gap-1.5">
                                                                <Icon icon="lucide:zap" width={10} className="text-rose-500" />
                                                                <span className="text-[10px] font-black text-rose-500 italic">{Number(zine.resonance || 0)}</span>
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
                                                {idx !== (artifact as any).zines.length - 1 && (
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

                        {artifact.exhibits && artifact.exhibits.length > 0 && (
                            <ExhibitGallery
                                exhibits={artifact.exhibits}
                                locale={locale}
                            />
                        )}
                    </div>

                    <div className="order-4 md:order-2 lg:order-none lg:col-span-4 flex flex-col border-t lg:border-t-0 border-zinc-900">
                        <PanelHeader label="Provenance_Tree" icon="lucide:cpu" />
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
                    </div>
                </div>
            </div>
        </>
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

/**
 * Provenance tree group — renders a labeled section with colored accent.
 * @param label - Section header label
 * @param icon - Iconify icon identifier
 * @param color - Accent color tier (rose=root, violet=core, zinc=collab)
 * @param credits - Array of credit objects to render
 * @param locale - Current locale for translation resolution
 */
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
        <div className="flex flex-col gap-2 relative z-10">
            <div className="flex items-center gap-2 lg:pl-3 mb-0.5">
                <Icon icon={icon} width={12} className={cn("shrink-0", labelColor)} />
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

/**
 * Individual credit row within a provenance group.
 * Displays entity avatar, name, role badge, and contributor class.
 * @param credit - Credit object with entity, role, and translation data
 * @param locale - Current locale for translation resolution
 * @param color - Accent color inherited from parent group
 */
function ProvenanceCreditRow({ credit, locale, color }: { credit: any; locale: string; color: 'rose' | 'violet' | 'zinc' }) {
    const name = resolveTranslation(credit.entity?.translations, locale)?.name || "Anon";
    const roleName = resolveTranslation(credit.translations, locale)?.role || credit.role || "ORIGIN";
    const contributorClass = credit.contributorClass || '';

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
                <div className="text-sm font-black text-zinc-100 uppercase italic truncate leading-tight">{name}</div>
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
