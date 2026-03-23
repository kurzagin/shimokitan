
"use client"

import React from 'react';
import { Icon } from '@iconify/react';


interface Spec {
    key: string;
    value: string;
}

interface Tag {
    id?: string;
    name: string;
}

interface WorkMetadataSectionProps {
    category: string;
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

export default function WorkMetadataSection({
    category,
    specs,
    updateSpec,
    upsertSpec,
    addSpec,
    removeSpec,
    tags,
    updateTag,
    addTag,
    removeTag
}: WorkMetadataSectionProps) {
    return (
        <div className="space-y-12">
            {/* 03. IP_SPECIFICATION_MATRIX */}
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">03 {'//'} IP_SPECIFICATION_MATRIX</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Specs / Canon Attributes */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-4">
                        <div className="flex items-center gap-2">
                            <Icon icon="lucide:terminal" className="text-zinc-500" width={12} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Canon_Attributes</span>
                        </div>
                        <button
                            type="button"
                            onClick={addSpec}
                            className="text-[10px] uppercase font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                        >
                            <Icon icon="lucide:plus" width={12} /> Add_Attribute
                        </button>
                    </div>

                    <div className="space-y-2">
                        {specs.map((spec, i) => (
                            <div key={i} className="flex gap-2 items-center animate-in fade-in slide-in-from-left-2">
                                <input
                                    value={spec.key}
                                    onChange={(e) => updateSpec(i, 'key', e.target.value)}
                                    placeholder="Attribute..."
                                    className="bg-black border border-zinc-800 p-2 text-[10px] font-mono uppercase text-zinc-500 w-28 text-right outline-none focus:border-zinc-700"
                                />
                                <div className="text-zinc-800">:</div>
                                <input
                                    value={spec.value}
                                    onChange={(e) => updateSpec(i, 'value', e.target.value)}
                                    placeholder="Value..."
                                    className="bg-black border border-zinc-800 p-2 text-xs text-zinc-300 flex-1 outline-none focus:border-zinc-700"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeSpec(i)}
                                    className="text-zinc-700 hover:text-rose-500 transition-colors"
                                >
                                    <Icon icon="lucide:x" width={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Master Taxonomy */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-4">
                        <div className="flex items-center gap-2">
                            <Icon icon="lucide:hash" className="text-zinc-500" width={12} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Master_Taxonomy</span>
                        </div>
                        <button
                            type="button"
                            onClick={addTag}
                            className="text-[10px] uppercase font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                        >
                            <Icon icon="lucide:plus" width={12} /> Add_Tag
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {tags.map((tag, i) => (
                            <div key={i} className="flex gap-2 items-center bg-zinc-950/30 border border-zinc-900 p-1 rounded">
                                <input
                                    value={tag.name}
                                    onChange={(e) => updateTag(i, 'name', e.target.value)}
                                    placeholder="Tag..."
                                    className="bg-transparent p-1.5 text-[10px] font-mono text-zinc-300 flex-1 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeTag(i)}
                                    className="text-zinc-700 hover:text-rose-500 transition-colors pr-1"
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
