"use client"

import React from 'react';
import { Icon } from '@iconify/react';
import { MediaUploader, PresignedUploader } from '@shimokitan/ui';
import WorkSearchPicker from './WorkSearchPicker';

interface Translation {
    locale: 'en' | 'id' | 'ja';
    title: string;
    description: string;
}

interface BasicInfoSectionProps {
    activeTab: 'en' | 'id' | 'ja';
    setActiveTab: (tab: 'en' | 'id' | 'ja') => void;
    translations: Translation[];
    updateTrans: (locale: string, field: 'title' | 'description', value: string) => void;
    
    thumbnailId: string | null;
    setThumbnailId: (id: string | null) => void;
    thumbnailUrl: string;
    setThumbnailUrl: (url: string) => void;
    onThumbnailFileSelect?: (file: File, objectUrl: string) => void;
    onThumbnailUrlSelect?: (url: string) => void;
    onThumbnailRemove?: () => void;

    posterId: string | null;
    setPosterId: (id: string | null) => void;
    posterUrl: string;
    setPosterUrl: (url: string) => void;
    onPosterFileSelect?: (file: File, objectUrl: string) => void;
    onPosterUrlSelect?: (url: string) => void;
    onPosterRemove?: () => void;

    vinylId: string | null;
    setVinylId: (id: string | null) => void;
    vinylUrl: string;
    setVinylUrl: (url: string) => void;
    onVinylFileSelect?: (file: File, objectUrl: string) => void;
    onVinylUrlSelect?: (url: string) => void;
    onVinylRemove?: () => void;
    
    illustrationId: string | null;
    setIllustrationId: (id: string | null) => void;
    illustrationUrl: string;
    setIllustrationUrl: (url: string) => void;
    onIllustrationFileSelect?: (file: File, objectUrl: string) => void;
    onIllustrationUrlSelect?: (url: string) => void;
    onIllustrationRemove?: () => void;

    category: string;
    setCategory: (val: string) => void;

    animeType: string | null;
    setAnimeType: (val: string | null) => void;
    entities: { id: string; name: string; type: string }[];
    userRole?: string;
    lockFlags?: boolean;
    artifactId: string;
    onHostedAudioUploaded?: (url: string) => void;
    workId: string | null;
    setWorkId: (val: string | null) => void;
    workTitle?: string | null;
    setWorkTitle?: (val: string | null) => void;
    isCategoryLocked?: boolean;
}

export default function BasicInfoSection({
    activeTab,
    setActiveTab,
    translations,
    updateTrans,
    thumbnailId,
    setThumbnailId,
    thumbnailUrl,
    setThumbnailUrl,
    onThumbnailFileSelect,
    onThumbnailUrlSelect,
    onThumbnailRemove,
    posterId,
    setPosterId,
    posterUrl,
    setPosterUrl,
    onPosterFileSelect,
    onPosterUrlSelect,
    onPosterRemove,
    vinylId,
    setVinylId,
    vinylUrl,
    setVinylUrl,
    onVinylFileSelect,
    onVinylUrlSelect,
    onVinylRemove,
    illustrationId,
    setIllustrationId,
    illustrationUrl,
    setIllustrationUrl,
    onIllustrationFileSelect,
    onIllustrationUrlSelect,
    onIllustrationRemove,
    category,
    setCategory,
    animeType,
    setAnimeType,
    entities,
    userRole,
    lockFlags = false,
    artifactId,
    onHostedAudioUploaded,
    workId,
    setWorkId,
    workTitle,
    setWorkTitle,
    isCategoryLocked = false
}: BasicInfoSectionProps) {

    return (
        <div className="space-y-12">
            {/* 01. REGISTRY & VISUALS */}
            <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                {/* 01.A SYSTEM_SIDEBAR */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Primary Meta */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-4">
                            <Icon icon="lucide:terminal" className="text-zinc-500" width={14} />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic font-mono">System_Module</h3>
                        </div>
                        <div className="space-y-5">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between pl-1">
                                    <label className="text-[10px] font-mono uppercase text-zinc-500">Category_Sector</label>
                                    {isCategoryLocked && <Icon icon="lucide:lock" width={10} className="text-zinc-700" />}
                                </div>
                                <select
                                    disabled={isCategoryLocked}
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className={`w-full bg-black border border-zinc-900 p-3 text-xs text-white focus:border-rose-600 outline-none transition-all rounded-lg appearance-none cursor-pointer font-bold ${isCategoryLocked ? 'opacity-50 cursor-not-allowed bg-zinc-950 grayscale' : ''}`}
                                >
                                    <option value="music">MUSIC_TRACK</option>
                                    <option value="anime">ANIME_FEATURE</option>
                                    <option value="game">GAME_ENTITY</option>
                                    <option value="illustration">ILLUSTRATION_WORK</option>
                                </select>
                            </div>

                            {category === 'music' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                                    <div className="space-y-2 p-4 bg-violet-950/10 border border-violet-900/30 rounded-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="text-[9px] font-mono uppercase text-violet-400 block">Canonical_Audio_Vault</label>
                                            <Icon icon="lucide:database" width={12} className="text-violet-500" />
                                        </div>
                                        <PresignedUploader
                                            context="artifacts"
                                            contextId={artifactId}
                                            accept="audio/*,application/x-mpegURL,.m3u8,.ts,.m4s,.m4a"
                                            label="UPLINK_BATCH"
                                            multiple={true}
                                            preserveFilename={true}
                                            onUploadSuccess={(url) => {
                                                if (onHostedAudioUploaded) onHostedAudioUploaded(url);
                                            }}
                                            className="h-24 border-dashed border-zinc-800 hover:border-violet-600 bg-black/40"
                                        />
                                        <p className="text-[7px] text-zinc-600 font-mono italic uppercase text-center mt-2">HLS Segment Synchronization Ready.</p>
                                    </div>
                                </div>
                            )}

                            {category === 'anime' && (
                                <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                                    <label className="text-[10px] font-mono uppercase text-zinc-500 pl-1">Visual_Context</label>
                                    <select
                                        value={animeType ?? ''}
                                        onChange={(e) => setAnimeType(e.target.value || null)}
                                        className="w-full bg-black border border-zinc-900 p-3 text-xs text-white focus:border-amber-600 outline-none transition-all rounded-lg appearance-none cursor-pointer font-bold"
                                    >
                                        <option value="">UNCATEGORIZED</option>
                                        <option value="pv">PROMOTIONAL_VIDEO</option>
                                        <option value="mv">MUSIC_VIDEO</option>
                                        <option value="trailer">TRAILER</option>
                                        <option value="op">OPENING</option>
                                        <option value="ed">ENDING</option>
                                        <option value="special">SPECIAL_STMT</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Inheritance & Linkage */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-4">
                            <Icon icon="lucide:link" className="text-zinc-500" width={14} />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic font-mono">Linkage_Module</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex flex-col bg-zinc-950/50 border border-zinc-900 rounded-lg transition-all hover:bg-zinc-950">
                                <div className="bg-zinc-900/50 px-3 py-1.5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon icon="lucide:anchor" width={10} className="text-zinc-500" />
                                        <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">Master_IP_Link</span>
                                    </div>
                                    {workId && <Icon icon="lucide:check-circle-2" width={10} className="text-emerald-500" />}
                                </div>
                                <div className="p-3">
                                    <WorkSearchPicker
                                        label=""
                                        value={workId}
                                        initialTitle={workTitle}
                                        onSelect={(w) => {
                                            setWorkId(w?.id || null);
                                            if (setWorkTitle) setWorkTitle(w?.title || null);
                                        }}
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* 01.B BRANDING_ORCHESTRATOR */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-4">
                        <Icon icon="lucide:layout-template" className="text-zinc-500" width={14} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic font-mono">Branding_Module</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* Portrait Key Visual */}
                        <div className={`${category === 'illustration' ? 'hidden' : 'md:col-span-3'} space-y-3`}>
                            <div className="flex flex-col pl-1">
                                <span className="text-[10px] font-mono uppercase text-zinc-400">Portrait_KV</span>
                                <span className="text-[8px] font-mono text-zinc-600 uppercase">Aspect: 2:3 / 3:4</span>
                            </div>
                            <MediaUploader
                                value={posterUrl}
                                contextType="artifact_asset"
                                onFileSelect={onPosterFileSelect}
                                onUrlSelect={onPosterUrlSelect}
                                onRemove={onPosterRemove}
                                className="aspect-[2/3] w-full rounded-xl border-zinc-900 group-hover:border-zinc-700"
                                label="Upload_Poster"
                            />
                        </div>

                        {/* Vinyl Square Asset */}
                        {category === 'music' && (
                            <div className="md:col-span-3 space-y-3">
                                <div className="flex flex-col pl-1">
                                    <span className="text-[10px] font-mono uppercase text-zinc-400">Vinyl_Aesthetic</span>
                                    <span className="text-[8px] font-mono text-zinc-600 uppercase">Aspect: 1:1</span>
                                </div>
                                <MediaUploader
                                    value={vinylUrl}
                                    contextType="artifact_asset"
                                    onFileSelect={onVinylFileSelect}
                                    onUrlSelect={onVinylUrlSelect}
                                    onRemove={onVinylRemove}
                                    className="aspect-square w-full rounded-xl border-zinc-900 group-hover:border-zinc-700"
                                    label="Upload_Vinyl"
                                />
                                <p className="text-[7px] text-zinc-600 font-mono italic uppercase text-center mt-2 px-2">Primary Audio Identity Signature.</p>
                            </div>
                        )}

                        {/* Illustration Asset */}
                        {category === 'illustration' && (
                            <div className="md:col-span-12 space-y-3">
                                <div className="flex flex-col pl-1">
                                    <span className="text-[10px] font-mono uppercase text-zinc-400">NETWORK_GATEWAYS</span>
                                    <span className="text-[8px] font-mono text-zinc-600 uppercase">Primary Illustration Identity</span>
                                </div>
                                <MediaUploader
                                    value={illustrationUrl}
                                    contextType="artifact_asset"
                                    onFileSelect={onIllustrationFileSelect}
                                    onUrlSelect={onIllustrationUrlSelect}
                                    onRemove={onIllustrationRemove}
                                    className="aspect-video w-full rounded-xl border-zinc-900 group-hover:border-zinc-700"
                                    label="Upload_Network_Gateway"
                                />
                                <p className="text-[7px] text-zinc-600 font-mono italic uppercase text-center mt-2 px-2">Canonical Visual Gateway for this Illustration.</p>
                            </div>
                        )}

                        {/* Landscape Hero Asset */}
                        <div className={`${category === 'music' ? 'md:col-span-6' : (category === 'illustration' ? 'hidden' : 'md:col-span-9')} space-y-3`}>
                            <div className="flex flex-col pl-1">
                                <span className="text-[10px] font-mono uppercase text-zinc-400">Landscape_Hero</span>
                                <span className="text-[8px] font-mono text-zinc-600 uppercase">Aspect: 16:9 / 21:9</span>
                            </div>
                            <MediaUploader
                                value={thumbnailUrl}
                                contextType="artifact_asset"
                                onFileSelect={onThumbnailFileSelect}
                                onUrlSelect={onThumbnailUrlSelect}
                                onRemove={onThumbnailRemove}
                                className="aspect-video w-full rounded-xl border-zinc-900 group-hover:border-zinc-700"
                                label="Upload_Hero_Cover"
                            />
                        </div>
                    </div>
                </div>
            </div>
            </div>

            {/* 02. LOCALIZATION_MATRIX */}
            <div className="w-full pt-8 border-t border-zinc-900">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-8">
                    <Icon icon="lucide:languages" className="text-zinc-500" width={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 font-mono">02 {'//'} LOCALIZATION_MATRIX</span>
                </div>
                <div className="flex flex-col bg-zinc-950/20 p-8 border border-zinc-900 rounded-xl backdrop-blur-md">
                    <div className="flex items-center justify-between mb-8 border-b border-zinc-900/50 pb-6">
                        <div className="space-y-1">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-500 italic">I18n_Signal_Localization</h3>
                            <p className="text-[9px] text-zinc-600 font-mono italic uppercase">Data_Synchronization_Across_Locales.</p>
                        </div>
                        <div className="flex gap-1 bg-black p-1 rounded-lg border border-zinc-900">
                            {translations.map(t => (
                                <button
                                    key={t.locale}
                                    type="button"
                                    onClick={() => setActiveTab(t.locale)}
                                    className={`px-6 py-2 text-[10px] font-black uppercase transition-all rounded-md ${activeTab === t.locale ? 'bg-rose-600 text-black shadow-[0_0_15px_rgba(225,29,72,0.3)]' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    {t.locale}
                                </button>
                            ))}
                        </div>
                    </div>

                    {translations.map(t => (
                        <div key={t.locale} className={activeTab === t.locale ? 'space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono uppercase text-zinc-500 pl-1 tracking-widest">Primary_Identifier ({t.locale})</label>
                                <input
                                    value={t.title}
                                    onChange={(e) => updateTrans(t.locale, 'title', e.target.value)}
                                    className="w-full bg-black border border-zinc-800 p-4 text-sm text-white focus:border-rose-600 outline-none transition-all rounded-lg font-bold italic"
                                    placeholder={`Artifact title in ${t.locale.toUpperCase()}`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono uppercase text-zinc-500 pl-1 tracking-widest">Detailed_Context ({t.locale})</label>
                                <textarea
                                    value={t.description}
                                    onChange={(e) => updateTrans(t.locale, 'description', e.target.value)}
                                    rows={6}
                                    className="w-full bg-black border border-zinc-800 p-4 text-sm text-white focus:border-rose-600 outline-none transition-all rounded-lg resize-none leading-relaxed"
                                    placeholder="Manifesto details / artifact historical context..."
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
