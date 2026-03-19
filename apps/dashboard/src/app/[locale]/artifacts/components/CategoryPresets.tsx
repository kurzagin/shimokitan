
"use client"

import React from 'react';
import { Icon } from '@iconify/react';

interface CategoryPresetsProps {
    category: string;
    specs: { key: string; value: string }[];
    updateSpec: (idx: number, field: 'key' | 'value', value: string) => void;
    upsertSpec: (key: string, value: string) => void;
    addSpec: () => void;
    removeSpec: (idx: number) => void;
}

export default function CategoryPresets({
    category,
    specs,
    updateSpec,
    upsertSpec,
    addSpec,
    removeSpec
}: CategoryPresetsProps) {

    const getPresets = () => {
        switch (category) {
            case 'music':
                return [
                    { key: 'duration', label: 'Duration_MS', placeholder: 'e.g. 245000' },
                    { key: 'bpm', label: 'BPM', placeholder: 'e.g. 128' },
                    { key: 'isrc', label: 'ISRC_Code', placeholder: 'e.g. US-S1Z-24-12345' },
                    { key: 'format', label: 'Audio_Format', placeholder: 'e.g. FLAC 24-bit' }
                ];
            case 'anime':
                return [
                    { key: 'episodes', label: 'Episode_Count', placeholder: 'e.g. 12' },
                    { key: 'year', label: 'Release_Year', placeholder: 'e.g. 2024' },
                    { key: 'anilist_id', label: 'AniList_Ref', placeholder: 'e.g. 153518' }
                ];
            default:


                return [];
        }
    };

    const presets = getPresets();

    // Ensure preset keys exist in specs
    const handlePresetChange = (key: string, value: string) => {
        const existingIdx = specs.findIndex(s => s.key === key);
        if (existingIdx !== -1) {
            updateSpec(existingIdx, 'value', value);
        } else {
            // This is a bit tricky since we don't have direct access to setSpecs here, 
            // but we can assume parent handles it or we use addSpec and then update.
            // For now, let's just render the presets as shortcuts.
        }
    };

    if (presets.length === 0) return null;

    return (
        <div className="space-y-4 bg-zinc-950/40 p-4 border border-zinc-900 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
                <Icon icon="lucide:layers" className="text-violet-500" width={14} />
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{category}_System_Specs</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {presets.map(preset => {
                    const specValue = specs.find(s => s.key === preset.key)?.value || '';
                    return (
                        <div key={preset.key} className="space-y-1">
                            <label className="text-[9px] font-mono uppercase text-zinc-600">{preset.label}</label>
                            <input
                                value={specValue}
                                onChange={(e) => {
                                    upsertSpec(preset.key, e.target.value);
                                }}
                                // To make it work cleanly, we'll suggest parent to pre-fill these keys
                                className="w-full bg-black border border-zinc-800 p-2 text-xs text-white focus:border-violet-600 outline-none transition-colors"
                                placeholder={preset.placeholder}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
