
"use client"

import React from 'react';
import { Icon } from '@iconify/react';

import CategoryPresets from './CategoryPresets';

interface Spec {
    key: string;
    value: string;
}

interface Tag {
    id?: string;
    name: string;
}

interface MetadataSectionProps {
    category: string;
    isHosted?: boolean;
    specs: Spec[];
    updateSpec: (idx: number, field: keyof Spec, value: string) => void;
    upsertSpec: (key: string, value: string) => void;
    addSpec: () => void;
    removeSpec: (idx: number) => void;
    tags: Tag[];
    updateTag: (idx: number, field: 'name', value: string) => void;
    addTag: () => void;
    removeTag: (idx: number) => void;
}

export default function MetadataSection({
    category,
    isHosted,
    specs,
    updateSpec,
    upsertSpec,
    addSpec,
    removeSpec,
    tags,
    updateTag,
    addTag,
    removeTag
}: MetadataSectionProps) {
    return (
        <div className="space-y-8">
            {!(category === 'music' && isHosted === false) && (
                <CategoryPresets
                    category={category}
                    specs={specs}
                    updateSpec={updateSpec}
                    upsertSpec={upsertSpec}
                    addSpec={addSpec}
                    removeSpec={removeSpec}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Specs / Attributes */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-6">
                        <div className="flex items-center gap-2">
                             <Icon icon="lucide:sliders-horizontal" className="text-zinc-500" width={14} />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 font-mono">04A // CORE_ATTRIBUTES</span>
                        </div>
                        <button
                            type="button"
                            onClick={addSpec}
                            className="text-[9px] uppercase font-black text-zinc-500 hover:text-white flex items-center gap-2 transition-all px-3 py-1 bg-zinc-950 border border-zinc-900 rounded-md"
                        >
                            <Icon icon="lucide:plus" width={10} /> ADD_SPEC
                        </button>
                    </div>

                    <div className="space-y-2">
                        {specs.map((spec, i) => {
                            // System-managed specs that should stay in the presets grid, not the list
                            const systemKeys: Record<string, string[]> = {
                                music: ['duration', 'bpm', 'isrc', 'format'],
                                anime: ['episodes', 'year', 'anilist_id'],
                                manga: ['episodes', 'year', 'anilist_id'],
                                software: ['version', 'license', 'engine']
                            };

                            const isSystemSpec = systemKeys[category]?.includes(spec.key);
                            if (isSystemSpec) return null;

                            return (
                                <div key={i} className="flex gap-2 items-center animate-in fade-in slide-in-from-left-2 group">
                                    <input
                                        value={spec.key}
                                        onChange={(e) => updateSpec(i, 'key', e.target.value)}
                                        placeholder="KEY_ID"
                                        className="bg-black border border-zinc-900 p-2.5 text-[10px] font-mono uppercase text-zinc-500 w-32 text-right outline-none focus:border-zinc-700 transition-all rounded"
                                    />
                                    <div className="text-zinc-800 font-mono">:</div>
                                    <input
                                        value={spec.value}
                                        onChange={(e) => updateSpec(i, 'value', e.target.value)}
                                        placeholder="DATA_VALUE"
                                        className="bg-black border border-zinc-900 p-2.5 text-[11px] text-zinc-300 flex-1 outline-none focus:border-rose-900 transition-all rounded italic"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeSpec(i)}
                                        className="text-zinc-700 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 px-2"
                                    >
                                        <Icon icon="lucide:x" width={12} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tags / Taxonomy */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-6">
                        <div className="flex items-center gap-2">
                             <Icon icon="lucide:tags" className="text-zinc-500" width={14} />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 font-mono">04B // GLOBAL_TAXONOMY</span>
                        </div>
                        <button
                            type="button"
                            onClick={addTag}
                            className="text-[9px] uppercase font-black text-zinc-500 hover:text-white flex items-center gap-2 transition-all px-3 py-1 bg-zinc-950 border border-zinc-900 rounded-md"
                        >
                            <Icon icon="lucide:plus" width={10} /> ADD_TAG
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {tags.map((tag, i) => (
                            <div key={i} className="flex gap-2 items-center bg-zinc-950/40 border border-zinc-900 p-1.5 rounded-lg hover:border-zinc-800 transition-all group">
                                <Icon icon="lucide:hash" width={10} className="text-zinc-700 ml-1" />
                                <input
                                    value={tag.name}
                                    onChange={(e) => updateTag(i, 'name', e.target.value)}
                                    placeholder="IDENTIFIER"
                                    className="bg-transparent p-1 text-[10px] font-mono text-zinc-400 flex-1 outline-none uppercase tracking-tighter"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeTag(i)}
                                    className="text-zinc-800 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 pr-1"
                                >
                                    <Icon icon="lucide:x" width={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
