"use client"

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { BrandIcon } from '@/components/BrandIcon';
import { MainLayout } from '@/components/layout/MainLayout';
import Link from 'next/link';
import { Dictionary, getMediaByRole } from '@shimokitan/utils';

// ─── Link Category Detection ─────────────────────────────────────────────────
type LinkCategory = 'social_media' | 'commerce' | 'platform' | 'video' | 'audio';

function getLinkCategory(platformId: string, platforms: any[]): string {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) return 'social_media';
    
    // Map DB categories to UI categories
    if (platform.category === 'commerce') return 'commerce';
    if (platform.category === 'video') return 'video';
    if (platform.category === 'audio') return 'audio';
    if (platform.category === 'social') return 'social_media';
    return 'platform';
}

// ─── Category accent colors ───────────────────────────────────────────────────
const CATEGORY_ACCENT: Record<string, string> = {
    social_media: 'border-zinc-700 hover:border-zinc-400',
    commerce: 'border-amber-700/60 hover:border-amber-400',
    platform: 'border-zinc-700 hover:border-zinc-400',
    video: 'border-rose-700/60 hover:border-rose-400',
    audio: 'border-emerald-700/60 hover:border-emerald-400',
};

const CATEGORY_LABEL_COLOR: Record<string, string> = {
    social_media: 'text-zinc-500',
    commerce: 'text-amber-500',
    platform: 'text-zinc-500',
    video: 'text-rose-500',
    audio: 'text-emerald-500',
};

// ─── Collapsible Module ───────────────────────────────────────────────────────
function Module({
    id,
    label,
    count,
    status,
    statusColor = 'bg-emerald-500',
    defaultOpen = false,
    children,
}: {
    id: string;
    label: string;
    count?: number | string;
    status?: string;
    statusColor?: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border border-zinc-900 bg-black">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-950 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${open ? statusColor : 'bg-zinc-700'} transition-colors`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 group-hover:text-white transition-colors">
                        {label}
                    </span>
                    {status && (
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border ${open ? 'border-zinc-700 text-zinc-400' : 'border-zinc-800 text-zinc-600'}`}>
                            {status}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {count !== undefined && (
                        <span className="text-[9px] font-mono text-zinc-600">{count}</span>
                    )}
                    <Icon
                        icon={open ? 'lucide:chevron-up' : 'lucide:chevron-down'}
                        width={12}
                        className="text-zinc-600 group-hover:text-zinc-400 transition-colors"
                    />
                </div>
            </button>
            {open && (
                <div className="border-t border-zinc-900 animate-in fade-in slide-in-from-top-1 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}



// ─── Hero Link Card (commerce / platform / social) ───────────────────────────
function HeroLinkCard({ link, dict, platforms }: { link: any, dict: Dictionary, platforms: any[] }) {
    const category = getLinkCategory(link.platform, platforms);
    const accent = CATEGORY_ACCENT[category];
    const labelColor = CATEGORY_LABEL_COLOR[category];
    
    const label = {
        commerce: dict.entities.links.commerce,
        platform: dict.entities.links.platform,
        social_media: dict.entities.links.social_media,
        video: "Video",
        audio: "Audio"
    }[category] || labelColor;

    return (
        <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative flex items-center justify-between px-5 py-4 bg-zinc-950 border-l-2 ${accent} transition-all duration-300`}
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center border border-zinc-800 group-hover:border-zinc-600 bg-black transition-colors">
                    <BrandIcon 
                        platform={link.platform} 
                        iconUrl={platforms.find(p => p.id === link.platform)?.iconUrl}
                        className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" 
                    />
                </div>
                <div className="space-y-0.5">
                    <div className={`text-[8px] font-black uppercase tracking-[0.25em] ${labelColor}`}>{label}</div>
                    <div className="text-sm font-black uppercase tracking-widest text-zinc-200 group-hover:text-white transition-colors">
                        {link.platform}
                    </div>
                </div>
            </div>
            <Icon icon="lucide:arrow-up-right" width={16} className="text-zinc-700 group-hover:text-white transition-colors" />
        </a>
    );
}

function VerifiedBadge({ className = "" }: { className?: string }) {
    return (
        <div className={`flex-shrink-0 flex items-center justify-center w-3.5 h-3.5 bg-violet-600 rotate-45 border border-violet-400/50 shadow-[0_0_8px_rgba(139,92,246,0.4)] ${className}`}>
            <Icon icon="lucide:check" width={10} strokeWidth={4} className="-rotate-45 text-white" />
        </div>
    );
}

import { resolveTranslation } from '@shimokitan/utils';

// ─── Main Component ────────────────────────────────────────────────────────────
export function EntityProfileTerminal({ entity, locale, dict, platforms = [] }: { entity: any, locale: string, dict: Dictionary, platforms?: any[] }) {
    const translation = resolveTranslation(entity.translations, locale);
    const name = translation?.name || (entity as any).name || "Anonymous Artist";

    // ── Sealed Gate ──────────────────────────────────────────────────────
    if (entity.civilStatus === 'sealed') {
        return (
            <MainLayout>
                <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
                    <div className="absolute w-full h-[1px] bg-white/5 animate-pulse" style={{ top: '15%' }} />
                    <div className="absolute w-full h-[1px] bg-white/5 animate-pulse" style={{ top: '85%' }} />
                </div>
                <div className="relative z-10 animate-in fade-in duration-1000 min-h-[80vh] flex items-center justify-center">
                    <div className="text-center space-y-8 max-w-md mx-auto px-6">
                        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                            <div className="absolute inset-0 border-2 border-zinc-800 animate-pulse" />
                            <div className="absolute inset-2 border border-zinc-900" />
                            <Icon icon="lucide:lock" width={32} className="text-zinc-700" />
                        </div>
                        <div className="space-y-2">
                            <div className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-[0.4em]">Signal_Lost</div>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-zinc-800 leading-none">[REDACTED]</h1>
                        </div>
                        <div className="space-y-4 pt-4">
                            <div className="inline-block px-4 py-2 border border-zinc-800 bg-zinc-950">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Current_Channel_Is_Sealed</span>
                            </div>
                            <p className="text-xs text-zinc-700 font-mono leading-relaxed">
                                This entity has not opened a channel in the district.<br />There is nothing here.
                            </p>
                        </div>
                        <Link href="/artists" className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-800 text-zinc-600 hover:text-white hover:border-zinc-500 transition-all text-[10px] font-black uppercase tracking-widest">
                            <Icon icon="lucide:arrow-left" width={14} />
                            Back_To_Registry
                        </Link>
                        <div className="pt-12 flex justify-center">
                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className={`h-1 w-3 ${i % 4 === 0 ? 'bg-zinc-800' : 'bg-zinc-900'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // ── Data prep ───────────────────────────────────────────────────────────
    const bio = translation?.bio || "";
    const entityType = entity.type?.toUpperCase() || "INDEPENDENT";
    const professionalTitle = translation?.status?.toUpperCase() || "";
    const credits = entity.credits || [];
    const sortedCredits = [...credits].sort((a: any, b: any) => (b.artifact?.resonance || 0) - (a.artifact?.resonance || 0));
    
    // PRIORITY: Use explicit primary artifact if defined. NO FALLBACK.
    let featuredCredit = null;
    if (entity.primaryArtifact) {
        const primaryCredit = credits.find((c: any) => c.artifactId === entity.primaryArtifact.id);
        featuredCredit = primaryCredit || {
            artifact: entity.primaryArtifact,
            role: translation?.status || "Featured"
        };
    }

    const commerceLinks = (entity.socialLinks || []).filter((l: any) => getLinkCategory(l.platform, platforms) === 'commerce');
    const videoLinks = (entity.socialLinks || []).filter((l: any) => getLinkCategory(l.platform, platforms) === 'video');
    const audioLinks = (entity.socialLinks || []).filter((l: any) => getLinkCategory(l.platform, platforms) === 'audio');
    const platformLinks = (entity.socialLinks || []).filter((l: any) => getLinkCategory(l.platform, platforms) === 'platform');
    const socialLinks = (entity.socialLinks || []).filter((l: any) => getLinkCategory(l.platform, platforms) === 'social_media');
    const hasLinks = (entity.socialLinks || []).length > 0;

    const commissionStatus = entity.commissionStatus || null;
    const announcement = entity.announcement || null;

    return (
        <MainLayout>
            {/* Ambient scan lines */}
            <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
                <div className="absolute w-full h-[1px] bg-white/[0.03]" style={{ top: '33%' }} />
                <div className="absolute w-full h-[1px] bg-white/[0.03]" style={{ top: '66%' }} />
                <div className="absolute top-0 left-[15%] w-[1px] h-full bg-white/[0.02]" />
                <div className="absolute top-0 left-[85%] w-[1px] h-full bg-white/[0.02]" />
            </div>

            <div className="relative z-10 animate-in fade-in duration-700 -mt-4">

                {/* ── HERO: Full-bleed featured artifact, unified bottom overlay ── */}
                {featuredCredit && (
                    <div className="relative w-full h-[400px] md:h-[580px] lg:h-[700px] overflow-hidden bg-zinc-950 border-b border-zinc-900">

                        {/* Background thumbnail */}
                        {getMediaByRole(featuredCredit.artifact.media, 'thumbnail')?.url || getMediaByRole(featuredCredit.artifact.media, 'poster')?.url ? (
                            <img
                                src={getMediaByRole(featuredCredit.artifact.media, 'thumbnail')?.url || getMediaByRole(featuredCredit.artifact.media, 'poster')?.url}
                                className="absolute inset-0 w-full h-full object-cover object-[center_25%] opacity-45 scale-[1.02] group-hover:scale-100 transition-transform duration-700"
                                alt=""
                            />
                        ) : (
                            <div className="absolute inset-0 bg-zinc-950" />
                        )}

                        {/* Scrim layers */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-t from-black/90 to-transparent" />

                        {/* FEATURED badge — top left */}
                        <div className="absolute top-12 left-10 flex items-center gap-1.5 px-3 py-2 bg-black/70 backdrop-blur-sm border border-violet-500/40">
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            <span className="text-[8px] font-black font-mono text-violet-400 uppercase tracking-[0.3em]">FEATURED</span>
                        </div>

                        {/* Unified bottom overlay — artifact on top, profile below */}
                        <div className="absolute bottom-10 md:bottom-20 lg:bottom-24 left-0 right-0 px-5 md:px-8 flex flex-col gap-0">

                            {/* ── ARTIFACT ROW ── */}
                            <Link
                                href={`/artifacts/${featuredCredit.artifact.id}`}
                                className="group/feat flex items-end justify-between gap-4 pb-4 border-b border-white/10 touch-manipulation"
                            >
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    {/* Category + resonance */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest">
                                            {featuredCredit.artifact.category}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Icon icon="lucide:diamond" width={7} className="text-violet-600" />
                                            <span className="text-[8px] font-mono text-zinc-500">{featuredCredit.artifact.resonance || 0}</span>
                                        </div>
                                    </div>

                                    {/* Artifact title — big */}
                                    <h2
                                        className="font-black italic uppercase text-white leading-[0.88] group-hover/feat:text-violet-100 transition-colors"
                                        style={{ fontSize: 'clamp(1.8rem, 6vw, 3rem)', letterSpacing: '-0.02em' }}
                                    >
                                        {resolveTranslation(featuredCredit.artifact.translations, locale)?.title || "UNTITLED"}
                                    </h2>

                                    {/* Role */}
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[8px] font-mono text-zinc-600 uppercase">ROLE //</span>
                                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">{featuredCredit.role}</span>
                                    </div>
                                </div>

                                {/* View arrow */}
                                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 border border-zinc-700 group-hover/feat:border-white group-hover/feat:bg-white/10 active:scale-95 transition-all">
                                    <Icon icon="lucide:arrow-up-right" width={16} className="text-zinc-500 group-hover/feat:text-white group-hover/feat:translate-x-0.5 group-hover/feat:-translate-y-0.5 transition-all" />
                                </div>
                            </Link>

                            {/* ── PROFILE ROW ── */}
                            <div className="flex items-center gap-4 pt-4">
                                {/* Avatar */}
                                <div className="relative flex-shrink-0 w-16 h-16 border border-zinc-600 bg-zinc-950 overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-400 z-10" />
                                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-400 z-10" />
                                    {entity.avatar?.url || entity.thumbnail?.url ? (
                                        <img src={entity.avatar?.url || entity.thumbnail?.url} className="w-full h-full object-cover" alt={name} />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600">
                                            <Icon icon="lucide:user-round" width={24} />
                                        </div>
                                    )}
                                </div>

                                {/* Identity Block */}
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <div className="flex items-center gap-2.5">
                                        <h1 className="font-black italic tracking-tighter uppercase text-white leading-none truncate" style={{ fontSize: 'clamp(1.4rem, 5vw, 2rem)' }}>
                                            {name}
                                        </h1>
                                        {entity.civilStatus === 'resident' && <VerifiedBadge className="w-4 h-4" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-[1px] bg-zinc-700" />
                                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.3em] font-black">
                                            {professionalTitle && <span className="text-zinc-200">{professionalTitle} // </span>}
                                            {entityType}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── If no featured artifact, show compact identity header ── */}
                {!featuredCredit && (
                    <div className="border-b border-zinc-900 p-8 md:p-12 -mx-4 flex items-center gap-8 bg-zinc-950/50">
                        <div className="relative flex-shrink-0 w-24 h-24 border-2 border-zinc-700 bg-zinc-950 overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-500 z-10" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-500 z-10" />
                            {entity.avatar?.url || entity.thumbnail?.url ? (
                                <img src={entity.avatar?.url || entity.thumbnail?.url} className="w-full h-full object-cover" alt={name} />
                            ) : (
                                <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-700">
                                    <Icon icon="lucide:user-round" width={48} />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-white leading-none">{name}</h1>
                                {entity.civilStatus === 'resident' && <VerifiedBadge className="w-5 h-5" />}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-[1px] bg-zinc-700" />
                                <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-[0.4em] font-black">
                                    {professionalTitle && <span className="text-zinc-300">{professionalTitle} // </span>}
                                    {entityType}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── BODY: Two-column on desktop ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-zinc-900 -mt-10 md:-mt-20 lg:-mt-24 relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">

                    {/* LEFT: Identity + Modules */}
                    <div className="lg:col-span-5 bg-black flex flex-col gap-px">

                        {/* Bio */}
                        {bio && (
                            <div className="px-5 py-5 border-b border-zinc-900">
                                <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em] mb-3">BIOGRAPHY</div>
                                <p className="text-sm text-zinc-300 leading-relaxed font-serif italic">
                                    {bio}
                                </p>
                            </div>
                        )}

                        {/* Living record signals */}
                        <div className="px-5 py-4 border-b border-zinc-900 grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest mb-1">RESIDENT_SINCE</div>
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-tight">
                                    {entity.residentSince
                                        ? new Date(entity.residentSince).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }).toUpperCase()
                                        : '—'}
                                </div>
                            </div>
                            <div>
                                <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest mb-1">ENTITY_TYPE</div>
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-tight">{entityType}</div>
                            </div>
                            <div>
                                <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest mb-1">PROFESSIONAL_TITLE</div>
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-tight">
                                    {professionalTitle || 'UNSPECIFIED'}
                                </div>
                            </div>
                            <div>
                                <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest mb-1">LAST_CREDIT</div>
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-tight">
                                    {sortedCredits[0]?.artifact?.createdAt
                                        ? new Date(sortedCredits[0].artifact.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }).toUpperCase()
                                        : '—'}
                                </div>
                            </div>
                        </div>

                        {/* MODULE: TRANSMISSION — announcement */}
                        {announcement && (
                            <Module
                                id="transmission"
                                label="TRANSMISSION_LOG"
                                count="1 ACTIVE"
                                status="LIVE"
                                statusColor="bg-emerald-500"
                                defaultOpen={true}
                            >
                                <div className="px-5 py-4">
                                    <p className="text-xs font-mono text-zinc-400 leading-relaxed border-l-2 border-zinc-700 pl-3">
                                        {announcement}
                                    </p>
                                </div>
                            </Module>
                        )}

                        {/* MODULE: COMMISSION STATUS */}
                        {commissionStatus && (
                            <Module
                                id="commission"
                                label="COMMISSION_STATUS"
                                status={commissionStatus}
                                statusColor={
                                    commissionStatus === 'OPEN' ? 'bg-emerald-500' :
                                        commissionStatus === 'WAITLIST' ? 'bg-amber-500' :
                                            'bg-red-600'
                                }
                                defaultOpen={commissionStatus === 'OPEN'}
                            >
                                <div className="px-5 py-4 flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${commissionStatus === 'OPEN' ? 'bg-emerald-500' :
                                        commissionStatus === 'WAITLIST' ? 'bg-amber-500' :
                                            'bg-red-600'
                                        }`} />
                                    <span className="text-xs font-black uppercase tracking-widest text-zinc-300">
                                        {commissionStatus === 'OPEN' && 'Currently accepting commissions'}
                                        {commissionStatus === 'WAITLIST' && 'Waitlist open — slots limited'}
                                        {commissionStatus === 'CLOSED' && 'Not accepting commissions'}
                                    </span>
                                </div>
                            </Module>
                        )}

                        {/* MODULE: VIDEO */}
                        {videoLinks.length > 0 && (
                            <Module
                                id="video"
                                label="Video_Channels"
                                count={`${videoLinks.length} CHANNELS`}
                                statusColor="bg-rose-500"
                                defaultOpen={true}
                            >
                                <div className="flex flex-col gap-px bg-zinc-900">
                                    {videoLinks.map((link: any, i: number) => (
                                        <HeroLinkCard key={i} link={link} dict={dict} platforms={platforms} />
                                    ))}
                                </div>
                            </Module>
                        )}

                        {/* MODULE: AUDIO */}
                        {audioLinks.length > 0 && (
                            <Module
                                id="audio"
                                label="Audio_Channels"
                                count={`${audioLinks.length} CHANNELS`}
                                statusColor="bg-emerald-500"
                                defaultOpen={true}
                            >
                                <div className="flex flex-col gap-px bg-zinc-900">
                                    {audioLinks.map((link: any, i: number) => (
                                        <HeroLinkCard key={i} link={link} dict={dict} platforms={platforms} />
                                    ))}
                                </div>
                            </Module>
                        )}

                        {/* MODULE: PLATFORM */}
                        {platformLinks.length > 0 && (
                            <Module
                                id="platform"
                                label={dict.entities.links.platform}
                                count={`${platformLinks.length} CHANNELS`}
                                statusColor="bg-zinc-500"
                                defaultOpen={true}
                            >
                                <div className="flex flex-col gap-px bg-zinc-900">
                                    {platformLinks.map((link: any, i: number) => (
                                        <HeroLinkCard key={i} link={link} dict={dict} platforms={platforms} />
                                    ))}
                                </div>
                            </Module>
                        )}

                        {/* MODULE: SOCIAL MEDIA */}
                        {socialLinks.length > 0 && (
                            <Module
                                id="social"
                                label={dict.entities.links.social_media}
                                count={`${socialLinks.length} CHANNELS`}
                                statusColor="bg-zinc-500"
                                defaultOpen={false}
                            >
                                <div className="flex flex-col gap-px bg-zinc-900">
                                    {socialLinks.map((link: any, i: number) => (
                                        <HeroLinkCard key={i} link={link} dict={dict} platforms={platforms} />
                                    ))}
                                </div>
                            </Module>
                        )}

                        {/* MODULE: COMMERCE */}
                        {commerceLinks.length > 0 && (
                            <Module
                                id="commerce"
                                label={dict.entities.links.commerce}
                                count={`${commerceLinks.length} CHANNELS`}
                                statusColor="bg-amber-500"
                                defaultOpen={true}
                            >
                                <div className="flex flex-col gap-px bg-zinc-900">
                                    {commerceLinks.map((link: any, i: number) => (
                                        <HeroLinkCard key={i} link={link} dict={dict} platforms={platforms} />
                                    ))}
                                </div>
                            </Module>
                        )}

                        {!hasLinks && (
                            <div className="px-5 py-10 text-center border-t border-zinc-900">
                                <Icon icon="lucide:unplug" className="mx-auto text-zinc-800 mb-2" width={32} />
                                <span className="text-[10px] font-mono font-bold text-zinc-700 uppercase tracking-widest">
                                    {dict.entities.links.no_uplinks}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Archive — credits */}
                    <div className="lg:col-span-7 bg-black min-h-screen">
                        {/* Archive header */}
                        <div className="lg:sticky lg:top-0 z-20 h-14 bg-zinc-950/90 backdrop-blur-md px-5 border-b border-zinc-900 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 border-2 border-zinc-600 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-zinc-400" />
                                </div>
                                <span className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">CREDITED_WORKS</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-zinc-600 uppercase">COUNT:</span>
                                <span className="text-[10px] font-black text-zinc-300">{sortedCredits.length}</span>
                            </div>
                        </div>

                        {/* Credits list */}
                        <div className="divide-y divide-zinc-900">
                            {sortedCredits.length > 0 ? (
                                sortedCredits.map((credit: any, i: number) => {
                                    const artifactTitle = resolveTranslation(credit.artifact.translations, locale)?.title || "UNTITLED";
                                    const isFirst = i === 0;

                                    return (
                                        <Link
                                            key={i}
                                            href={`/artifacts/${credit.artifact.id}`}
                                            className="group flex gap-4 p-4 md:p-5 hover:bg-white/[0.025] transition-colors relative"
                                        >
                                            {/* Thumbnail */}
                                            <div className={`flex-shrink-0 bg-zinc-900 border-2 border-zinc-800 overflow-hidden group-hover:border-zinc-500 transition-all shadow-xl ${isFirst ? 'w-28 h-20 md:w-36 md:h-24' : 'w-20 h-14 md:w-28 md:h-18'}`}>
                                                {getMediaByRole(credit.artifact.media, 'thumbnail')?.url ? (
                                                    <img
                                                        src={getMediaByRole(credit.artifact.media, 'thumbnail').url}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                        alt=""
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-800">
                                                        <Icon icon="lucide:disc" width={24} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Metadata */}
                                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[8px] font-mono font-black text-zinc-600 uppercase tracking-widest bg-zinc-900 px-1.5 py-0.5">
                                                        {credit.artifact.category}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <Icon icon="lucide:diamond" width={8} className="text-violet-600/50 group-hover:text-violet-500 transition-colors" />
                                                        <span className="text-[8px] font-mono text-zinc-600 group-hover:text-violet-400 transition-colors">
                                                            {credit.artifact.resonance || 0}
                                                        </span>
                                                    </div>
                                                </div>

                                                <h3 className={`font-black uppercase text-zinc-200 group-hover:text-white transition-colors leading-tight ${isFirst ? 'text-base md:text-lg' : 'text-sm md:text-base'}`}>
                                                    {artifactTitle}
                                                </h3>

                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[8px] font-mono text-zinc-600 uppercase">ROLE //</span>
                                                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-300 group-hover:text-white transition-colors">
                                                        {credit.role}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right accent bar */}
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-8 bg-zinc-800 group-hover:bg-violet-500 transition-colors" />
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="p-16 text-center">
                                    <Icon icon="lucide:archive" className="mx-auto text-zinc-800 mb-3" width={40} />
                                    <span className="text-[10px] font-mono font-bold text-zinc-700 uppercase tracking-widest block">
                                        NO_CREDITS_ARCHIVED
                                    </span>
                                    <span className="text-[9px] font-mono text-zinc-800 uppercase tracking-widest block mt-1">
                                        Works will appear here when archived
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
