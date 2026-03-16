
"use client"

import React from 'react';
import { Icon } from '@iconify/react';
import { EXHIBIT_TYPES } from '@shimokitan/utils';
import { MediaUploader } from '@shimokitan/ui';
import { uploadMediaAction } from '../../media-actions';

export interface Exhibit {
    id?: string;
    type: typeof EXHIBIT_TYPES[number];
    url?: string | null;
    mediaId?: string | null;
    mediaUrl?: string | null; // For UI preview
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
}

export default function ExhibitsSection({
    exhibits,
    setExhibits,
    artifactId,
    onMediaUploaded
}: ExhibitsSectionProps) {
    const addExhibit = () => {
        setExhibits([...exhibits, {
            type: 'other',
            translations: [
                { locale: 'en', title: '' },
                { locale: 'id', title: '' },
                { locale: 'ja', title: '' }
            ]
        }]);
    };

    const removeExhibit = (idx: number) => {
        setExhibits(exhibits.filter((_, i) => i !== idx));
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-6">
                <div className="flex items-center gap-2">
                    <Icon icon="lucide:archive" className="text-zinc-500" width={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 font-mono">03.5 // ARCHIVAL_EXHIBITS</span>
                </div>
                <button
                    type="button"
                    onClick={addExhibit}
                    className="text-[9px] uppercase font-black text-zinc-500 hover:text-rose-500 flex items-center gap-2 transition-all px-3 py-1 bg-zinc-950 border border-zinc-900 rounded-md hover:border-rose-900/50"
                >
                    <Icon icon="lucide:plus" width={10} /> DEPLOY_EXHIBIT
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {exhibits.map((ex, i) => (
                    <div key={i} className="group relative bg-zinc-950/40 border border-zinc-900 rounded-xl p-6 transition-all hover:bg-zinc-950 hover:border-zinc-800">
                        <div className="absolute -top-3 -right-3">
                            <button
                                type="button"
                                onClick={() => removeExhibit(i)}
                                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 hover:text-rose-500 hover:border-rose-900/50 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Icon icon="lucide:x" width={14} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Media / Type Column */}
                            <div className="lg:col-span-3 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest pl-1">Exhibit_Type</label>
                                    <select
                                        value={ex.type}
                                        onChange={(e) => updateExhibit(i, 'type', e.target.value)}
                                        className="w-full bg-black border border-zinc-900 p-2.5 text-[10px] font-bold uppercase text-zinc-400 outline-none rounded-lg focus:border-rose-900 appearance-none cursor-pointer"
                                    >
                                        {EXHIBIT_TYPES.map(t => (
                                            <option key={t} value={t}>{t.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest pl-1">Visual_Asset</label>
                                    <MediaUploader
                                        value={ex.mediaUrl || ''}
                                        onChange={(mediaId: string, url: string) => onMediaUploaded(i, mediaId, url)}
                                        contextType="artifact_asset"
                                        uploadAction={uploadMediaAction}
                                        className="aspect-video"
                                    />
                                </div>
                            </div>

                            {/* Content Column */}
                            <div className="lg:col-span-9 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <label className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest pl-1">Network_Uplink (Optional)</label>
                                        <input
                                            value={ex.url || ''}
                                            onChange={(e) => updateExhibit(i, 'url', e.target.value)}
                                            placeholder="https://..."
                                            className="w-full bg-black border border-zinc-800 p-2 text-[11px] text-zinc-300 outline-none focus:border-rose-900 italic transition-all rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 border-t border-zinc-900 pt-4">
                                    {['en', 'ja', 'id'].map(lang => {
                                        const trans = ex.translations.find(t => t.locale === lang) || { title: '', description: '' };
                                        return (
                                            <div key={lang} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                <div className="md:col-span-4 space-y-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[8px] font-black uppercase text-zinc-700 font-mono">{lang}</span>
                                                        <label className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest">Exhibit_Title</label>
                                                    </div>
                                                    <input
                                                        value={trans.title}
                                                        onChange={(e) => updateTranslation(i, lang, 'title', e.target.value)}
                                                        className="w-full bg-transparent border-b border-zinc-900 p-1 text-xs text-white placeholder:text-zinc-800 focus:border-rose-900 outline-none transition-all"
                                                        placeholder={`System name in ${lang.toUpperCase()}...`}
                                                    />
                                                </div>
                                                <div className="md:col-span-8 space-y-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <label className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest">Entry_Bio_Context</label>
                                                    </div>
                                                    <textarea
                                                        value={trans.description || ''}
                                                        onChange={(e) => updateTranslation(i, lang, 'description', e.target.value)}
                                                        className="w-full bg-transparent border-b border-zinc-900 p-1 text-[10px] text-zinc-400 placeholder:text-zinc-800 focus:border-rose-900 outline-none transition-all min-h-[40px] resize-none"
                                                        placeholder="Supplementary archival notes..."
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {exhibits.length === 0 && (
                    <div className="py-12 border border-dashed border-zinc-900 rounded-xl flex flex-col items-center justify-center gap-3 bg-zinc-950/20">
                        <Icon icon="lucide:archive" className="text-zinc-800" width={24} />
                        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">No archival exhibits registered for this entry.</p>
                        <button
                            type="button"
                            onClick={addExhibit}
                            className="text-[9px] font-black uppercase text-rose-600 hover:text-white transition-all underline decoration-rose-900 underline-offset-4"
                        >
                            Initialize_Context_Buffer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
