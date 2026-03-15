"use client"

import React from 'react';
import { Icon } from '@iconify/react';
import { MediaUploader, PresignedUploader } from '@shimokitan/ui';
import { uploadMediaAction } from '../../media-actions';
import ArtifactSearchPicker from './ArtifactSearchPicker';
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

    posterId: string | null;
    setPosterId: (id: string | null) => void;
    posterUrl: string;
    setPosterUrl: (url: string) => void;
    onPosterFileSelect?: (file: File, objectUrl: string) => void;
    onPosterUrlSelect?: (url: string) => void;

    vinylId: string | null;
    setVinylId: (id: string | null) => void;
    vinylUrl: string;
    setVinylUrl: (url: string) => void;
    onVinylFileSelect?: (file: File, objectUrl: string) => void;
    onVinylUrlSelect?: (url: string) => void;

    category: string;
    setCategory: (val: string) => void;

    sourceArtifactId: string | null;
    setSourceArtifactId: (val: string | null) => void;
    animeType: string | null;
    setAnimeType: (val: string | null) => void;
    isHosted: boolean;
    setIsHosted: (val: boolean) => void;
    sourceArtifactTitle?: string | null;

    entities: any[];
    userRole?: string;
    lockFlags?: boolean;
    artifactId: string;
    onHostedAudioUploaded?: (url: string) => void;
    workId: string | null;
    setWorkId: (val: string | null) => void;
    workTitle?: string | null;
    setWorkTitle?: (val: string | null) => void;
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
    posterId,
    setPosterId,
    posterUrl,
    setPosterUrl,
    onPosterFileSelect,
    onPosterUrlSelect,
    vinylId,
    setVinylId,
    vinylUrl,
    setVinylUrl,
    onVinylFileSelect,
    onVinylUrlSelect,
    category,
    setCategory,

    sourceArtifactId,
    setSourceArtifactId,
    animeType,
    setAnimeType,
    isHosted,
    setIsHosted,
    sourceArtifactTitle,

    entities,
    userRole,
    lockFlags = false,
    artifactId,
    onHostedAudioUploaded,
    workId,
    setWorkId,
    workTitle,
    setWorkTitle
}: BasicInfoSectionProps) {

    return (
        <div className="space-y-12">
            {/* 01. REGISTRY & VISUALS */}
            <div className="space-y-8">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">01 // REGISTRY_&_VISUALS</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Column 1: System Meta */}
                    <div className="space-y-4 bg-zinc-950/50 p-6 border border-zinc-900 rounded-xl">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-4 italic">System_Meta</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono uppercase text-zinc-500">Category_Signal</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-black border border-zinc-900 p-3 text-xs text-white focus:border-rose-600 outline-none rounded-lg"
                                >
                                    <option value="music">MUSIC_TRACK</option>
                                    <option value="anime">ANIME_FEATURE</option>
                                    <option value="game">GAME_ENTITY</option>
                                    <option value="software">SOFTWARE_UNIT</option>
                                    <option value="zine">ZINE_RECORD</option>
                                    <option value="event">EVENT_LOG</option>
                                    <option value="other">OTHER_SIGNAL</option>
                                </select>
                            </div>
                            <div className="flex flex-col bg-violet-950/20 overflow-hidden relative group/anchor transition-all hover:bg-violet-950/30">
                                {/* Semantic strip */}
                                <div className="absolute top-0 left-0 w-1 h-full bg-violet-600" />
                                
                                <div className="bg-violet-600 px-3 py-1.5 flex items-center gap-2">
                                    <Icon icon="lucide:anchor" width={12} className="text-violet-950" />
                                    <span className="text-[9px] text-violet-950 font-black uppercase tracking-[0.2em]">Master_IP_Link</span>
                                </div>
                                <div className="p-4 pt-4">
                                    <p className="text-[8px] text-violet-400 font-black uppercase tracking-widest mb-3 opacity-80">Parent_Work_Identity</p>
                                    <WorkSearchPicker
                                        label=""
                                        value={workId}
                                        initialTitle={workTitle}
                                        onSelect={(w) => {
                                            setWorkId(w?.id || null);
                                            if (setWorkTitle) setWorkTitle(w?.title || null);
                                        }}
                                    />
                                    <p className="text-[8px] text-zinc-500 font-mono italic mt-3 uppercase tracking-tighter">Establishing the canonical ancestry of this manifestation.</p>
                                </div>
                            </div>


                            {category === 'music' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono uppercase text-zinc-500 text-violet-400">Hosting_Signal</label>
                                        <select
                                            value={isHosted ? "hosted" : "unhosted"}
                                            onChange={(e) => setIsHosted(e.target.value === "hosted")}
                                            className="w-full bg-black border border-zinc-900 p-3 text-xs text-white focus:border-violet-600 outline-none rounded-lg"
                                        >
                                            <option value="unhosted">UNHOSTED (EXTERNAL)</option>
                                            <option value="hosted">HOSTED (INTERNAL)</option>
                                        </select>
                                    </div>

                                    {isHosted && (
                                        <div className="pt-2">
                                            <label className="text-[10px] font-mono uppercase text-zinc-500 mb-2 block text-violet-400">Canonical_Audio_Uplink (HLS_SUPPORTED)</label>
                                            <PresignedUploader
                                                context="artifacts"
                                                contextId={artifactId}
                                                accept="audio/*,application/x-mpegURL,.m3u8,.ts,.m4s,.m4a"
                                                label="UPLINK_BATCH_FILES"
                                                multiple={true}
                                                preserveFilename={true}
                                                onUploadSuccess={(url) => {
                                                    if (onHostedAudioUploaded) onHostedAudioUploaded(url);
                                                }}
                                                className="h-28 border-dashed border-zinc-800 hover:border-violet-600"
                                            />
                                            <p className="text-[8px] text-zinc-600 font-mono italic mt-2 uppercase">Select all HLS segments + index.m3u8 for full synchronization.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {category === 'anime' && (
                                <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                                    <label className="text-[10px] font-mono uppercase text-zinc-500 text-amber-500">Visual_Context</label>
                                    <select
                                        value={animeType ?? ''}
                                        onChange={(e) => setAnimeType(e.target.value || null)}
                                        className="w-full bg-black border border-zinc-900 p-3 text-xs text-white focus:border-amber-600 outline-none rounded-lg"
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

                    {/* Column 2: Main Visuals */}
                    <div className="bg-zinc-950/50 p-6 border border-zinc-900 rounded-xl space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-500 italic mb-4">Visual_Branding</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">Poster_KV (2:3)</label>
                                <MediaUploader
                                    value={posterUrl}
                                    contextType="artifact_asset"
                                    onFileSelect={onPosterFileSelect}
                                    onUrlSelect={onPosterUrlSelect}
                                    className="aspect-[2/3] rounded-lg border border-zinc-900 overflow-hidden shadow-inner w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">Editorial_Thumb (16:9)</label>
                                <MediaUploader
                                    value={thumbnailUrl}
                                    contextType="artifact_asset"
                                    onFileSelect={onThumbnailFileSelect}
                                    onUrlSelect={onThumbnailUrlSelect}
                                    className="aspect-[16/9] rounded-lg border border-zinc-900 overflow-hidden shadow-inner w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Format Aesthetic */}
                    <div className="bg-zinc-950/50 p-6 border border-zinc-900 rounded-xl space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-500 italic mb-4">Vinyl_Branding</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">Vinyl_Cover (1:1)</label>
                                <MediaUploader
                                    value={vinylUrl}
                                    contextType="artifact_asset"
                                    onFileSelect={onVinylFileSelect}
                                    onUrlSelect={onVinylUrlSelect}
                                    className="aspect-square rounded-lg border border-zinc-900 overflow-hidden shadow-inner w-full bg-zinc-950"
                                />
                                <p className="text-[8px] text-zinc-700 font-mono italic mt-2 uppercase tracking-tighter">Canonical_Media_Selection_Required.</p>
                            </div>
                            <div className="flex flex-col justify-end pt-4 border-t border-zinc-900/50">
                                <p className="text-[9px] text-zinc-500 font-mono italic uppercase tracking-widest leading-relaxed">
                                    The square vinyl art is the primary visual identity for the audio station and physical distribution layouts. High-fidelity renders recommended.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 02. LOCALIZATION MATRIX */}
            <div className="w-full pt-8 border-t border-zinc-900">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">02 // LOCALIZATION_MATRIX</span>
                </div>
                <div className="flex flex-col bg-zinc-950 p-6 border border-zinc-900 rounded-xl">
                    <div className="flex items-center justify-between mb-8 border-b border-zinc-900/50 pb-6">
                        <div className="space-y-1">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-500 italic">I18n_Signal_Localization</h3>
                            <p className="text-[9px] text-zinc-600 font-mono italic">DATA_REPLICATION_ACROSS_LOCATIONS.</p>
                        </div>
                        <div className="flex gap-1 bg-black p-1 rounded-lg border border-zinc-900">
                            {translations.map(t => (
                                <button
                                    key={t.locale}
                                    type="button"
                                    onClick={() => setActiveTab(t.locale)}
                                    className={`px-6 py-2 text-[10px] font-black uppercase transition-all rounded-md ${activeTab === t.locale ? 'bg-rose-600 text-black' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    {t.locale}
                                </button>
                            ))}
                        </div>
                    </div>

                    {translations.map(t => (
                        <div key={t.locale} className={activeTab === t.locale ? 'space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono uppercase text-zinc-400 pl-1">Primary_Identifier ({t.locale})</label>
                                <input
                                    value={t.title}
                                    onChange={(e) => updateTrans(t.locale, 'title', e.target.value)}
                                    className="w-full bg-black border border-zinc-800 p-4 text-sm text-white focus:border-rose-600 outline-none transition-all rounded-lg font-bold"
                                    placeholder={`Artifact title in ${t.locale.toUpperCase()}`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono uppercase text-zinc-400 pl-1">Detailed_Context ({t.locale})</label>
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

            {/* derivation picker if present or if we want to allow it */}
            <div className="bg-rose-950/5 border border-rose-900/20 p-6 rounded-xl animate-in fade-in slide-in-from-top-2">
                <ArtifactSearchPicker
                    label="DERIVATION_SOURCE"
                    value={sourceArtifactId}
                    initialTitle={sourceArtifactTitle}
                    onSelect={(art) => setSourceArtifactId(art?.id || null)}
                    placeholder="Link this entry to its original source record..."
                />
            </div>
        </div>
    );
}
