"use client"

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Badge, cn } from '@shimokitan/ui';
import Link from '@/components/Link';
import { useStationStore } from '@/lib/store/station-store';

type Artifact = {
    id: string;
    slug: string;
    title: string;
    category: string;
    nature: string;
    coverImage: string | null;
    resonance: number | null;
    isMajor: boolean;
    isVerified: boolean;
    artist?: string;
    src: string;
    format: string;
    bitrate: string;
};

const categories = [
    { label: 'ALL_AUDIO', value: 'all' },
    { label: 'ORIGINAL', value: 'original' },
    { label: 'COVER', value: 'cover' },
    { label: 'LIVE', value: 'live' },
];

export default function BackAlleyBrowser({ initialArtifacts }: { initialArtifacts: Artifact[] }) {
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const station = useStationStore();

    const handlePlay = (artifact: Artifact, e: React.MouseEvent) => {
        e.preventDefault();
        
        if (station.currentTrack?.src === artifact.src) {
            if (station.isClosed) station.setClosed(false);
            window.dispatchEvent(new CustomEvent("shim_audio_command", { detail: { type: "playToggle" } }));
        } else {
            station.initialize({
                title: artifact.title,
                artist: artifact.artist || "ANON",
                album: "Single",
                cover: artifact.coverImage || "",
                src: artifact.src,
                format: artifact.format || "LOSSLESS",
                bitrate: artifact.bitrate || "1411 KBPS",
            });
            station.setClosed(false);
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent("shim_audio_command", { detail: { type: "playToggle" } }));
            }, 500);
        }
    };

    const filteredArtifacts = initialArtifacts.filter(a => {
        const matchesCategory = activeCategory === 'all' || a.nature === activeCategory;
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
                        BACK_<span className="text-violet-600">ALLEY</span>
                    </h1>
                </div>
                <p className="max-w-2xl font-mono text-zinc-500 text-xs uppercase tracking-widest leading-relaxed">
                    The district's underground audio registry. High-fidelity sonic broadcasts and raw resonant Signals.
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

            {/* Artifact Registry Audio-List */}
            <div className="flex flex-col gap-4">
                {filteredArtifacts.length > 0 ? (
                    filteredArtifacts.map((artifact) => (
                        <button
                            key={artifact.id}
                            onClick={(e) => handlePlay(artifact, e)}
                            className={cn(
                                "group/item transition-all duration-500 bg-zinc-950/20 border border-zinc-900 flex items-center p-3 relative overflow-hidden hover:border-violet-900/50 text-left w-full",
                                artifact.isMajor && "border-rose-900/30 hover:border-rose-500/50"
                            )}
                        >
                            {/* Vinyl Record Visual */}
                            <div className="relative w-24 h-24 shrink-0 mr-6">
                                {/* The Record itself */}
                                <div className="absolute inset-0 rounded-full bg-black border border-zinc-800 shadow-[0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden group-hover/item:rotate-360 transition-transform duration-3000 ease-linear">
                                    {/* Vinyl Grooves (Fake) */}
                                    <div className="absolute inset-1 rounded-full border border-zinc-900/60" />
                                    <div className="absolute inset-3 rounded-full border border-zinc-900/60" />
                                    <div className="absolute inset-5 rounded-full border border-zinc-900/60" />
                                    <div className="absolute inset-7 rounded-full border border-zinc-900/60" />
                                    
                                    {/* Center Label (Cover Image) */}
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-zinc-900 z-10 animate-spin-slow" style={{ animationDuration: '10s' }}>
                                        <img
                                            src={artifact.coverImage || '/placeholder.png'}
                                            alt={artifact.title}
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Spindle hole */}
                                        <div className="absolute inset-0 m-auto w-1.5 h-1.5 bg-black rounded-full border border-zinc-900" />
                                    </div>
                                    {/* Gloss / Shine Overlay */}
                                    <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-transparent rounded-full pointer-events-none" />
                                </div>
                            </div>

                            {/* Track Info & Waveform */}
                            <div className="flex flex-col flex-1 min-w-0 pr-4 relative z-10">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-black italic tracking-tighter uppercase text-zinc-300 group-hover/item:text-white transition-colors truncate pr-1">
                                        {artifact.title}
                                    </h3>
                                    {artifact.isVerified && (
                                        <div className="w-4 h-4 rounded-full bg-rose-600 flex items-center justify-center shadow-[0_0_10px_rgba(225,29,72,0.3)] shrink-0">
                                            <Icon icon="lucide:check" width={10} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 opacity-80 group-hover/item:opacity-100 transition-opacity mb-4">
                                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Artist //</span>
                                    <span className="text-xs font-black italic text-zinc-400 uppercase tracking-tighter truncate">
                                        {artifact.artist || "ANON"}
                                    </span>
                                </div>

                                {/* Abstract Waveform Visual */}
                                <div className="flex items-center gap-[3px] h-8 w-full max-w-sm opacity-50 group-hover/item:opacity-100 transition-opacity">
                                    {/* Generative-looking waveform bars */}
                                    {[...Array(30)].map((_, i) => {
                                        const h1 = Math.abs(Math.sin(i * 0.4) * 50);
                                        const h2 = Math.abs(Math.cos(i * 1.1) * 30);
                                        const h3 = Math.abs(Math.sin(i * 2.3) * 20);
                                        const height = 15 + h1 + h2 + h3;
                                        return (
                                            <div 
                                                key={i} 
                                                className="w-1 bg-zinc-600 rounded-full group-hover/item:bg-violet-500 transition-colors duration-500" 
                                                style={{ 
                                                    height: `${Math.max(10, Math.min(100, height))}%`,
                                                    animationDelay: `${i * 30}ms`
                                                }} 
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Side Stats / Actions */}
                            <div className="hidden sm:flex items-center gap-8 shrink-0 text-right pl-4 relative z-10">
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em]">Quality</span>
                                    <Badge variant='clean' className="text-[10px] py-0 px-2 border-none bg-zinc-800/80">
                                        {artifact.format || "LOSSLESS"}
                                    </Badge>
                                </div>
                                <div className="flex flex-col items-end gap-1 w-16">
                                    <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em]">Resonance</span>
                                    <div className="flex items-center gap-1">
                                        <Icon icon="lucide:zap" width={10} height={10} className="text-rose-500" />
                                        <span className="text-sm font-black text-rose-500 italic">
                                            {artifact.resonance || 0}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Play Button */}
                                <div className="w-12 h-12 rounded-full border border-zinc-700 bg-zinc-900/50 flex items-center justify-center text-zinc-400 group-hover/item:bg-violet-600 group-hover/item:text-white group-hover/item:border-violet-500 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover/item:shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                                    <Icon icon="lucide:play" width={20} className="ml-1" />
                                </div>
                            </div>
                            
                            {/* Background ambient glow on hover */}
                            <div className="absolute inset-0 bg-linear-to-r from-violet-900/0 via-violet-900/5 to-violet-900/0 opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity duration-700" />
                        </button>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/20">
                        <div className="relative mb-6">
                            <Icon icon="lucide:radio-tower" width={48} className="text-zinc-800" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-zinc-900 rounded-full border border-zinc-800 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full opacity-50" />
                            </div>
                        </div>
                        <h3 className="text-xl font-black italic tracking-tighter uppercase text-zinc-600 mb-2">SIGNAL_LOST</h3>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] max-w-xs text-center leading-relaxed">
                            The registry is currently silent. No resonant audio Signals detected in the district archives.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

