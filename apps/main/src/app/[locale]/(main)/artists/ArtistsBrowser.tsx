"use client"

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { BentoCard, Badge, cn, DistrictAvatar } from '@shimokitan/ui';
import Link from 'next/link';

import { getEntityUrl } from '@shimokitan/utils';

type Entity = {
    id: string;
    slug: string;
    name: string;
    type: string;
    avatarUrl: string | null;
    thumbnailUrl: string | null;
    civilStatus: string;
    artifactCount: number;
};

const entityTypes = [
    { label: 'ALL_ARTISTS', value: 'all' },
    { label: 'INDEPENDENT', value: 'independent' },
    { label: 'CIRCLE', value: 'circle' },
    { label: 'ORGANIZATION', value: 'organization' },
    { label: 'AGENCY', value: 'agency' },
];

export default function ArtistsBrowser({ initialEntities }: { initialEntities: Entity[] }) {
    const [activeType, setActiveType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredEntities = initialEntities.filter(e => {
        const matchesType = activeType === 'all' || e.type === activeType;
        const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-700">
            {/* Header Section */}
            <header className="flex flex-col gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-12 bg-violet-600 shadow-[0_0_20px_rgba(139,92,246,0.5)]" />
                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none py-1">
                        THE_<span className="text-violet-600">ARCHITECTS</span>
                    </h1>
                </div>
                <p className="max-w-2xl font-mono text-zinc-500 text-xs uppercase tracking-widest leading-relaxed">
                    The architects of the district's resonance. Creators, agencies, and circles operating within the analog shadows.
                </p>
            </header>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-3 sticky top-0 z-40 bg-black/90 backdrop-blur-xl py-4 border-b border-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                {entityTypes.map((type) => (
                    <button
                        key={type.value}
                        onClick={() => setActiveType(type.value)}
                        className={`px-4 py-2 text-[10px] font-black tracking-[0.2em] uppercase transition-all border-l-2 ${activeType === type.value
                            ? 'bg-violet-600/10 border-violet-500 text-violet-400'
                            : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-300'
                            }`}
                    >
                        {type.label}
                    </button>
                ))}
                <div className="flex-1" />
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-zinc-950 border-l-2 border-zinc-800 focus-within:border-violet-500 transition-colors">
                    <Icon icon="lucide:search" width={12} height={12} className="text-zinc-500" aria-hidden="true" />
                    <input
                        type="text"
                        placeholder="LOCATE_ENTITY..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-[10px] uppercase font-mono text-zinc-300 placeholder:text-zinc-700 w-40 tracking-widest"
                    />
                </div>
            </div>

            {/* Entity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredEntities.map((entity) => (
                    <Link
                        key={entity.id}
                        href={getEntityUrl(entity)}
                        className="group relative bg-zinc-950/20 border border-zinc-900 hover:border-violet-900/50 p-6 transition-all duration-700 overflow-hidden flex flex-col gap-6"
                    >
                        <div className="flex items-start gap-6 z-10">
                            <DistrictAvatar 
                                src={entity.avatarUrl} 
                                fallbackSrc={entity.thumbnailUrl}
                                size="xl" 
                                shape="square" 
                                className="border border-zinc-800"
                                alt={entity.name}
                            />
                            <div className="flex flex-col flex-1 min-w-0 pt-1">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1 h-1 bg-violet-600/50 group-hover:bg-violet-500 transition-colors" />
                                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">{entity.type}</span>
                                        <div className="w-1 h-3 bg-zinc-800 mx-1" />
                                        <span className="text-[7px] font-black uppercase text-violet-500 tracking-widest px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded-sm">
                                            RESIDENT
                                        </span>
                                    </div>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase text-zinc-300 group-hover:text-white transition-colors truncate">
                                    {entity.name}
                                </h3>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-zinc-900 flex items-center justify-between z-10 transition-colors group-hover:border-violet-900/30">
                            <div className="flex items-center gap-1.5">
                                <Icon icon="lucide:file-box" width={10} className="text-zinc-600 group-hover:text-violet-500/50" aria-hidden="true" />
                                <span className="text-[10px] font-black italic text-zinc-400 group-hover:text-violet-400 uppercase tracking-tighter transition-colors">
                                    {entity.artifactCount} Artifacts
                                </span>
                            </div>
                            <span className="text-[8px] font-mono text-zinc-600">ID_{entity.id.slice(0, 8)}</span>
                        </div>

                        {/* Hover Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-violet-950/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        
                        {/* Static Deco HUD */}
                        <div className="absolute top-0 right-0 p-1 border-b border-l border-zinc-900 group-hover:border-violet-900/50 transition-colors z-10">
                            <div className="w-1.5 h-1.5 bg-zinc-800 group-hover:bg-violet-500 transition-colors" />
                        </div>
                    </Link>
                ))}
            </div>
            {filteredEntities.length === 0 && (
                <div className="py-20 text-center border border-dashed border-zinc-900">
                    <span className="text-zinc-700 font-mono text-xs uppercase">No artists matching the current frequency.</span>
                </div>
            )}
        </div>
    );
}
