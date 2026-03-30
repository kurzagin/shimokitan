
import React from 'react';
import { Icon } from '@iconify/react';
import Link from '@/components/Link';
import { ensureUserSync } from '../../auth-helpers';
import { redirect } from 'next/navigation';

export default async function NewArtifactCategoryPickerPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    const user = await ensureUserSync();
    if (!user || (user.role !== 'founder' && user.role !== 'architect')) {
        redirect('/');
    }

    const categories = [
        {
            id: 'music',
            title: 'MUSIC_TRACK',
            icon: 'lucide:music-2',
            color: 'rose',
            description: 'Canonical audio recordings, originals, and licensed covers indexed for the high-fidelity player.'
        },
        {
            id: 'anime',
            title: 'ANIME_FEATURE',
            icon: 'lucide:film',
            color: 'amber',
            description: 'Promotional videos, high-budget music videos, and cinematic sequences from the anime industry.'
        },
        {
            id: 'game',
            title: 'GAME_ENTITY',
            icon: 'lucide:gamepad-2',
            color: 'sky',
            description: 'Interactive experiences, commercial game trailers, and independent digital entertainment records.'
        },
        {
            id: 'illustration',
            title: 'ILLUSTRATION_WORK',
            icon: 'lucide:image',
            color: 'emerald',
            description: 'Visual masterpieces, concept art, and digital illustrations designated as Network Gateways.'
        }
    ];

    return (
        <div className="space-y-12 max-w-6xl mx-auto py-12">
            <header className="flex flex-col gap-4 text-center">
                <Link 
                    href="/artifacts" 
                    className="inline-flex items-center gap-2 bg-zinc-900/50 border border-zinc-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all self-center rounded-lg"
                >
                    <Icon icon="lucide:arrow-left" width={14} />
                    Exit_Registry_Module
                </Link>
                <div className="space-y-2">
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
                        Registry <span className="text-rose-600">Entry_Point.</span>
                    </h1>
                    <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest max-w-xl mx-auto leading-relaxed">
                        Select a sector to initialize the registration protocol. 
                        Each domain features specialized metadata requirements.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                {categories.map((cat) => (
                    <Link
                        key={cat.id}
                        href={`/artifacts/new/${cat.id}`}
                        className="group relative bg-zinc-950 border border-zinc-900 p-8 rounded-xl transition-all hover:bg-black hover:border-zinc-500 overflow-hidden"
                    >
                        {/* Background Symbolism */}
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                            <Icon icon={cat.icon} width={120} />
                        </div>

                        <div className="flex flex-col gap-6 relative z-10">
                            <div className={`w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-${cat.color}-600/50 transition-colors`}>
                                <Icon 
                                    icon={cat.icon} 
                                    className={`text-zinc-500 group-hover:text-${cat.id === 'music' ? 'rose' : (cat.id === 'anime' ? 'amber' : (cat.id === 'game' ? 'sky' : 'emerald'))}-500 transition-colors`} 
                                    width={28} 
                                />
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-tighter italic mb-1">
                                        {cat.title}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-1 w-1 rounded-full bg-${cat.id === 'music' ? 'rose' : (cat.id === 'anime' ? 'amber' : (cat.id === 'game' ? 'sky' : 'emerald'))}-600 animate-pulse`} />
                                        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Sector_{cat.id.toUpperCase()} Ready</span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed max-w-xs">
                                    {cat.description}
                                </p>
                            </div>

                            <div className="pt-4 flex items-center gap-3">
                                <span className="text-[9px] font-black uppercase text-white tracking-widest border-b-2 border-zinc-800 group-hover:border-white transition-all">Initialize_Registry</span>
                                <Icon icon="lucide:chevron-right" width={14} className="text-zinc-600 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <footer className="text-center">
                <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.3em]">
                    Shimokitan Dashboard // Unauthorized Access is Logged
                </p>
            </footer>
        </div>
    );
}
