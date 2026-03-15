"use client"

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Badge, cn } from '@shimokitan/ui';
import Link from 'next/link';

type Artifact = {
    id: string;
    slug: string;
    title: string;
    category: string;
    coverImage: string | null;
    status: string | null;
    resonance: number | null;
    isMajor: boolean;
    isVerified: boolean;
    artist?: string;
    type: 'work' | 'artifact';
    aspectRatio: 'vertical' | 'video' | 'square';
};

const categories = [
    { label: 'ALL_ARTIFACTS', value: 'all' },
    { label: 'ANIME', value: 'anime' },
    { label: 'MUSIC', value: 'music' },
];

export default function ArtifactsBrowser({ initialArtifacts }: { initialArtifacts: Artifact[] }) {
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredArtifacts = initialArtifacts.filter(a => {
        const matchesCategory = activeCategory === 'all' || a.category === activeCategory;
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="w-full flex flex-col gap-6 pb-20 animate-in fade-in duration-700">
            {/* Header Section */}
            <header className="flex flex-col gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-12 bg-violet-600 shadow-[0_0_20px_rgba(139,92,246,0.5)]" />
                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none py-1">
                        CRATE_<span className="text-violet-600">DIGGING</span>
                    </h1>
                </div>
                <p className="max-w-2xl font-mono text-zinc-500 text-xs uppercase tracking-widest leading-relaxed">
                    Consult the artifacts of the district. Sift through the analog noise to find the resonance that fits your frequency.
                </p>
            </header>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-3 sticky top-0 z-40 bg-black/90 backdrop-blur-xl py-4 border-b border-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                {categories.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() => setActiveCategory(cat.value)}
                        className={`px-4 py-2 text-[10px] font-black tracking-[0.2em] uppercase transition-all border-l-2 ${activeCategory === cat.value
                            ? 'bg-violet-600/10 border-violet-500 text-violet-400'
                            : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-300'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
                <div className="flex-1" />
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-zinc-950 border-l-2 border-zinc-800 focus-within:border-violet-500 transition-colors">
                    <Icon icon="lucide:search" width={12} height={12} className="text-zinc-500" />
                    <input
                        type="text"
                        placeholder="ISOLATE_SIGNAL..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-[10px] uppercase font-mono text-zinc-300 placeholder:text-zinc-700 w-40 tracking-widest"
                    />
                </div>
            </div>

            {/* Artifact Registry Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filteredArtifacts.map((artifact) => (
                    <Link
                        key={artifact.id}
                        href={artifact.type === 'work' ? `/works/${artifact.id}` : `/artifacts/${artifact.id}`}
                        className={cn(
                            "group/item transition-all duration-700 bg-zinc-950/20 border border-zinc-900 flex flex-col relative overflow-hidden hover:border-violet-900/50",
                            artifact.isMajor && "border-rose-900/30 hover:border-rose-500/50",
                            artifact.aspectRatio === 'vertical' && "col-span-1 row-span-2 md:row-span-1"
                        )}
                    >
                            <div className="flex flex-col h-full">
                                {/* Visual Entry Focus */}
                                <div className={cn(
                                    "relative overflow-hidden bg-zinc-900",
                                    artifact.aspectRatio === 'vertical' ? "aspect-[2/3]" : "aspect-video"
                                )}>
                                    <img
                                        src={artifact.coverImage || '/placeholder.png'}
                                        alt={artifact.title}
                                        className="w-full h-full object-cover group-hover/item:scale-105 transition-all duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />

                                    {/* Verification Stamp */}
                                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                        {artifact.isVerified && (
                                            <div className="w-4 h-4 rounded-full bg-rose-600 flex items-center justify-center shadow-[0_0_10px_rgba(225,29,72,0.3)]">
                                                <Icon icon="lucide:check" width={8} className="text-white" />
                                            </div>
                                        )}
                                        <Badge variant={artifact.status === 'the_pit' ? 'distortion' : 'clean'} className="text-[9px] py-0 px-1 border-none bg-black/60 backdrop-blur-md">
                                            {artifact.status === 'the_pit' ? 'PIT' : 'ALLEY'}
                                        </Badge>
                                    </div>

                                </div>

                                {/* Registry Entry Data */}
                                <div className="p-3.5 flex flex-col gap-3 relative">
                                    <div className="flex flex-col gap-0.5 pt-0.5">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Origin //</span>
                                            <span className="text-[10px] font-black italic text-zinc-400 uppercase tracking-tighter truncate">
                                                {artifact.artist || "ANON"}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-black italic tracking-tighter uppercase text-zinc-300 group-hover/item:text-white transition-colors leading-tight line-clamp-2">
                                            {artifact.title}
                                        </h3>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-zinc-900">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1 h-1 bg-violet-600/20 group-hover/item:bg-violet-600 transition-colors rounded-full" />
                                            <span className="text-[10px] font-mono text-zinc-500 group-hover/item:text-zinc-400 uppercase tracking-widest transition-colors font-bold">
                                                {artifact.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Icon icon="lucide:zap" width={8} height={8} className="text-rose-500" />
                                            <span className="text-xs font-black text-rose-500 italic">
                                                {artifact.resonance || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
