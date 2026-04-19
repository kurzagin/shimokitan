
"use client"

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { EXHIBIT_TYPES, extractMediaId, getThumbnailUrl } from '@shimokitan/utils';
import { MediaUploader } from '@shimokitan/ui';
import { uploadMediaAction } from '../../media-actions';
import { toast } from 'sonner';

export interface Exhibit {
    id?: string;
    type: typeof EXHIBIT_TYPES[number];
    url?: string | null;
    mediaId?: string | null;
    mediaUrl?: string | null;
    isPrimary?: boolean;
    translations: {
        locale: 'en' | 'id' | 'ja';
        title: string;
        description?: string;
    }[];
}

interface ExhibitsSectionProps {
    exhibits: Exhibit[];
    setExhibits: (exhibits: Exhibit[]) => void;
    artifactId: string;
    onMediaUploaded: (idx: number, mediaId: string, url: string) => void;
    onMediaUrlSelected: (idx: number, url: string) => void;
}

/**
 * Icon mapping for each exhibit type.
 */
const TYPE_ICONS: Record<string, string> = {
    trailer: "lucide:play-circle",
    opening: "lucide:sunrise",
    ending: "lucide:sunset",
    promotion: "lucide:megaphone",
    gallery: "lucide:image",
    other: "lucide:file",
};

/**
 * Color accent mapping for each exhibit type.
 */
const TYPE_COLORS: Record<string, string> = {
    trailer: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    opening: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    ending: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    promotion: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    gallery: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    other: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
};

/**
 * ExhibitsSection - Dashboard form component for managing artifact exhibits.
 *
 * Renders a collapsed thumbnail grid by default, with a modal editor
 * for individual exhibits. Supports media upload, type selection,
 * and multi-locale translations.
 */
export default function ExhibitsSection({
    exhibits,
    setExhibits,
    artifactId,
    onMediaUploaded,
    onMediaUrlSelected
}: ExhibitsSectionProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const addExhibit = () => {
        const newExhibit: Exhibit = {
            type: 'other',
            translations: [
                { locale: 'en', title: '' },
                { locale: 'id', title: '' },
                { locale: 'ja', title: '' }
            ]
        };
        setExhibits([...exhibits, newExhibit]);
        setEditingIndex(exhibits.length);
    };

    const removeExhibit = (idx: number) => {
        setExhibits(exhibits.filter((_, i) => i !== idx));
        if (editingIndex === idx) setEditingIndex(null);
        else if (editingIndex !== null && editingIndex > idx) {
            setEditingIndex(editingIndex - 1);
        }
    };

    const updateExhibit = (idx: number, field: keyof Exhibit, value: any) => {
        const next = [...exhibits];
        next[idx] = { ...next[idx], [field]: value };
        setExhibits(next);
    };

    const updateTranslation = (exIdx: number, locale: string, field: 'title' | 'description', value: string) => {
        const next = [...exhibits];
        const transIdx = next[exIdx].translations.findIndex(t => t.locale === locale);
        if (transIdx !== -1) {
            next[exIdx].translations[transIdx] = { ...next[exIdx].translations[transIdx], [field]: value };
        } else {
            next[exIdx].translations.push({ locale: locale as any, title: '', [field]: value });
        }
        setExhibits(next);
    };

    const moveExhibit = (fromIdx: number, direction: 'up' | 'down') => {
        const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
        if (toIdx < 0 || toIdx >= exhibits.length) return;
        const next = [...exhibits];
        [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
        setExhibits(next);
        if (editingIndex === fromIdx) setEditingIndex(toIdx);
        else if (editingIndex === toIdx) setEditingIndex(fromIdx);
    };

    /** Get the English title for display in collapsed view. */
    const getDisplayTitle = (ex: Exhibit): string => {
        return ex.translations.find(t => t.locale === 'en')?.title
            || ex.translations.find(t => t.title)?.title
            || 'Untitled';
    };

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                    <Icon icon="lucide:archive" className="text-rose-500" width={16} />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 font-mono">03.5 // ARCHIVAL_EXHIBITS</span>
                    {exhibits.length > 0 && (
                        <span className="text-[9px] font-mono text-zinc-700 ml-2">
                            [{exhibits.length}]
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={addExhibit}
                    className="text-[10px] uppercase font-black text-rose-500 hover:text-white flex items-center gap-2 transition-all px-4 py-2 bg-zinc-950 border border-zinc-900 rounded-lg hover:bg-rose-600 hover:border-rose-500 shadow-sm"
                >
                    <Icon icon="lucide:plus" width={12} /> DEPLOY_NEW_EXHIBIT
                </button>
            </div>

            {/* Thumbnail Grid (Collapsed View) */}
            {exhibits.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {exhibits.map((ex, i) => (
                        <div
                            key={i}
                            className={`group relative border rounded-xl overflow-hidden cursor-pointer transition-all ${
                                editingIndex === i
                                    ? 'border-rose-500 ring-1 ring-rose-500/30'
                                    : ex.isPrimary ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-zinc-800 hover:border-zinc-600'
                            }`}
                            onClick={() => setEditingIndex(editingIndex === i ? null : i)}
                        >
                            {/* Thumbnail */}
                            <div className="aspect-video bg-zinc-950 relative">
                                {ex.mediaUrl ? (
                                    <img
                                        src={ex.mediaUrl}
                                        alt={getDisplayTitle(ex)}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            if (target.src.includes('maxresdefault.jpg')) {
                                                target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Icon icon={TYPE_ICONS[ex.type] || 'lucide:file'} width={24} className="text-zinc-800" />
                                    </div>
                                )}

                                {/* Position Badge */}
                                <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/70 border border-zinc-700 flex items-center justify-center">
                                    <span className="text-[8px] font-black text-zinc-400">{i + 1}</span>
                                </div>

                                {/* Reorder Controls */}
                                <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); moveExhibit(i, 'up'); }}
                                        disabled={i === 0}
                                        className="w-5 h-5 bg-black/70 border border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
                                    >
                                        <Icon icon="lucide:chevron-up" width={10} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); moveExhibit(i, 'down'); }}
                                        disabled={i === exhibits.length - 1}
                                        className="w-5 h-5 bg-black/70 border border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-white disabled:opacity-30 transition-colors"
                                    >
                                        <Icon icon="lucide:chevron-down" width={10} />
                                    </button>
                                </div>

                                {/* Delete Button */}
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeExhibit(i); }}
                                    className="absolute bottom-1.5 right-1.5 w-6 h-6 bg-black/70 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-600 hover:text-rose-500 hover:border-rose-900/50 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Icon icon="lucide:x" width={11} />
                                </button>
                            </div>

                            {/* Card Footer */}
                            <div className="px-2.5 py-2 bg-zinc-900/40 border-t border-zinc-800/50">
                                <div className="flex items-center gap-1.5 mb-1 justify-between">
                                    <span className={`inline-flex items-center gap-1 px-1 py-0.5 border text-[7px] font-black uppercase tracking-wider rounded-sm ${TYPE_COLORS[ex.type] || TYPE_COLORS.other}`}>
                                        <Icon icon={TYPE_ICONS[ex.type] || 'lucide:file'} width={8} />
                                        {ex.type}
                                    </span>
                                    {ex.isPrimary && (
                                        <Icon icon="lucide:star" className="text-amber-500 shrink-0 fill-amber-500/20" width={12} />
                                    )}
                                </div>
                                <p className="text-[10px] font-bold text-zinc-400 truncate leading-tight">
                                    {getDisplayTitle(ex)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Editor Panel (Inline, below grid) */}
            {editingIndex !== null && editingIndex < exhibits.length && (
                <ExhibitEditor
                    exhibit={exhibits[editingIndex]}
                    index={editingIndex}
                    artifactId={artifactId}
                    onUpdate={(field, value) => updateExhibit(editingIndex, field, value)}
                    onUpdateTranslation={(locale, field, value) => updateTranslation(editingIndex, locale, field, value)}
                    onMediaUploaded={(mediaId, url) => onMediaUploaded(editingIndex, mediaId, url)}
                    onMediaUrlSelected={(url) => onMediaUrlSelected(editingIndex, url)}
                    onClose={() => setEditingIndex(null)}
                    onRemove={() => removeExhibit(editingIndex)}
                />
            )}

            {/* Empty State */}
            {exhibits.length === 0 && (
                <div className="py-16 border-2 border-dashed border-zinc-900 rounded-2xl flex flex-col items-center justify-center gap-5 bg-zinc-950/10 transition-all hover:bg-zinc-950/20">
                    <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 shadow-inner">
                        <Icon icon="lucide:archive" className="text-zinc-700" width={28} />
                    </div>
                    <div className="text-center space-y-1.5">
                        <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em] font-black">No archival exhibits registered.</p>
                        <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest italic">Deploy exhibits to add context to this artifact.</p>
                    </div>
                    <button
                        type="button"
                        onClick={addExhibit}
                        className="bg-rose-600/10 hover:bg-rose-600 border border-rose-900/30 hover:border-rose-500 text-rose-500 hover:text-white px-7 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(225,29,72,0.1)]"
                    >
                        Initialize_Context_Buffer
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * ExhibitEditor - Inline detail editor for a single exhibit.
 * Replaces the old fully-expanded card with a focused editing panel.
 */
function ExhibitEditor({
    exhibit,
    index,
    artifactId,
    onUpdate,
    onUpdateTranslation,
    onMediaUploaded,
    onMediaUrlSelected,
    onClose,
    onRemove,
}: {
    exhibit: Exhibit;
    index: number;
    artifactId: string;
    onUpdate: (field: keyof Exhibit, value: any) => void;
    onUpdateTranslation: (locale: string, field: 'title' | 'description', value: string) => void;
    onMediaUploaded: (mediaId: string, url: string) => void;
    onMediaUrlSelected: (url: string) => void;
    onClose: () => void;
    onRemove: () => void;
}) {
    return (
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Editor Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <span className="text-[9px] font-black text-rose-500 font-mono">{index + 1}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-mono">
                        Edit_Exhibit
                    </span>
                    <button
                        type="button"
                        onClick={() => onUpdate('isPrimary', !exhibit.isPrimary)}
                        className={`ml-3 flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            exhibit.isPrimary 
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                                : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-amber-500 hover:border-amber-900/50'
                        }`}
                    >
                        <Icon icon="lucide:star" width={14} className={exhibit.isPrimary ? 'fill-amber-500/30' : ''} />
                        Primary_Exhibit
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-[9px] uppercase font-black text-zinc-600 hover:text-rose-500 transition-colors flex items-center gap-1.5 px-3 py-1.5 border border-transparent hover:border-rose-900/30 rounded"
                    >
                        <Icon icon="lucide:trash-2" width={11} />
                        Remove
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-7 h-7 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-600 transition-all rounded"
                    >
                        <Icon icon="lucide:x" width={14} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Media & Type Column */}
                <div className="lg:col-span-5 space-y-5">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest pl-1">Exhibition_Visual</label>
                            <span className="text-[8px] font-mono text-zinc-600 uppercase">Aspect: 16:9 / 4:3</span>
                        </div>
                        <MediaUploader
                            value={exhibit.mediaUrl || ''}
                            onChange={(mediaId: string, url: string) => onMediaUploaded(mediaId, url)}
                            onUrlSelect={onMediaUrlSelected}
                            contextType="artifact_asset"
                            contextId={artifactId}
                            uploadAction={uploadMediaAction}
                            className="aspect-video w-full rounded-xl border border-zinc-900 overflow-hidden shadow-inner bg-black"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest pl-1">Exhibit_Type</label>
                            <select
                                value={exhibit.type}
                                onChange={(e) => onUpdate('type', e.target.value)}
                                className="w-full bg-black border border-zinc-900 p-3 text-xs font-bold uppercase text-zinc-300 outline-none rounded-xl focus:border-rose-900 appearance-none cursor-pointer transition-colors"
                            >
                                {EXHIBIT_TYPES.map(t => (
                                    <option key={t} value={t}>{t.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest pl-1">Target_Link</label>
                            <input
                                value={exhibit.url || ''}
                                onChange={(e) => onUpdate('url', e.target.value)}
                                placeholder="URL..."
                                className="w-full bg-black border border-zinc-800 p-3 text-xs text-zinc-300 outline-none focus:border-rose-900 transition-all rounded-xl"
                            />
                            {exhibit.url?.includes('youtu') && !exhibit.mediaUrl && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!exhibit.url) return;
                                        try {
                                            const id = extractMediaId(exhibit.url, 'youtube');
                                            if (!id) {
                                                toast.error("Failed to extract ID from provided URL");
                                                return;
                                            }
                                            const thumbUrl = getThumbnailUrl(id, 'youtube', 'max');
                                            if (thumbUrl) onMediaUrlSelected(thumbUrl);
                                        } catch (e: any) {
                                            console.error("Failed to extract YT thumbnail", e);
                                        }
                                    }}
                                    className="text-[9px] font-mono uppercase bg-rose-600/10 text-rose-500 border border-rose-900/30 hover:border-rose-500 px-3 py-1.5 rounded w-full flex items-center justify-center gap-2 mt-2 transition-all"
                                >
                                    <Icon icon="lucide:download" width={12} />
                                    Fetch_YT_Thumbnail
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Localization Column */}
                <div className="lg:col-span-7 flex flex-col">
                    <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest pl-1 mb-3">Localization_Data_Buffer</label>
                    <div className="flex-1 space-y-5 bg-black/40 border border-zinc-900/50 p-5 rounded-2xl">
                        {['en', 'ja', 'id'].map(lang => {
                            const trans = exhibit.translations.find(t => t.locale === lang) || { title: '', description: '' };
                            return (
                                <div key={lang} className="space-y-3 pb-5 last:pb-0 border-b border-zinc-900 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded bg-zinc-900 flex items-center justify-center border border-zinc-800 shrink-0">
                                            <span className="text-[9px] font-black uppercase text-rose-500 font-mono">{lang}</span>
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                value={trans.title}
                                                onChange={(e) => onUpdateTranslation(lang, 'title', e.target.value)}
                                                className="w-full bg-transparent border-b border-zinc-800 p-1 text-sm font-bold text-white placeholder:text-zinc-800 focus:border-rose-900 outline-none transition-all"
                                                placeholder={`Identity in ${lang.toUpperCase()}...`}
                                            />
                                        </div>
                                    </div>
                                    <div className="pl-10">
                                        <textarea
                                            value={trans.description || ''}
                                            onChange={(e) => onUpdateTranslation(lang, 'description', e.target.value)}
                                            className="w-full bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-3 text-xs text-zinc-400 placeholder:text-zinc-800 focus:border-rose-900 outline-none transition-all min-h-[64px] resize-none leading-relaxed"
                                            placeholder="Supplementary archival metadata..."
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
