"use client"

import React from 'react';
import { Icon } from '@iconify/react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MOCK_ZINES, MOCK_ARTIFACTS } from '@/lib/mock-data';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ArtifactZinesPage() {
    const params = useParams();
    const id = params?.id as string;
    const artifact = MOCK_ARTIFACTS[id];
    const artifactZines = MOCK_ZINES.filter(z => z.artifactId === id);

    if (!artifact) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500 font-mono">
                    <h1 className="text-xl font-black uppercase tracking-widest">Shard Not Found</h1>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">

                {/* Back Link */}
                <Link href={`/cinema/${id}`} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:text-rose-600 transition-colors group">
                    <Icon icon="lucide:arrow-left" width={14} height={14} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Artifact
                </Link>

                {/* Header: The Echo Archive */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 pb-12 border-b border-zinc-900">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-baseline gap-4">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
                                {artifact.title} // <span className="text-rose-600">ECHOES</span>
                            </h1>
                        </div>
                        <p className="max-w-2xl font-mono text-zinc-500 text-[11px] uppercase tracking-widest leading-relaxed">
                            Complete historical record of resident resonance for Fragment_{artifact.id}.
                        </p>
                    </div>

                    <div className="flex items-center gap-8 font-mono">
                        <div className="flex flex-col items-end">
                            <span className="text-[11px] text-zinc-600">TOTAL_SHARDS</span>
                            <span className="text-xl font-black text-zinc-200">{artifactZines.length}</span>
                        </div>
                        <div className="w-px h-10 bg-zinc-900" />
                        <div className="flex flex-col items-end">
                            <span className="text-[11px] text-zinc-600">AVG_RESONANCE</span>
                            <span className="text-xl font-black text-rose-500">
                                {artifactZines.length > 0
                                    ? Math.round(artifactZines.reduce((acc, z) => acc + z.resonanceRating, 0) / artifactZines.length)
                                    : 0}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Zine List - More vertical/list-like for detail page */}
                <div className="flex flex-col gap-12 max-w-4xl mx-auto w-full">
                    {artifactZines.length > 0 ? (
                        artifactZines.map((zine) => (
                            <div key={zine.id} className="relative pl-12 md:pl-20 group">
                                {/* Vertical Resonance Line */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-900 group-hover:bg-rose-900/40 transition-colors" />
                                <div className="absolute left-[-12px] top-0 w-6 h-6 rounded-full bg-zinc-950 border-4 border-zinc-900 flex items-center justify-center group-hover:border-rose-900/40 transition-colors">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                                <Icon icon="lucide:user" className="text-zinc-600" width={18} height={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black uppercase text-zinc-100">{zine.authorName}</span>
                                                <span className="text-[11px] font-mono text-zinc-600 italic">{zine.authorHandle}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-zinc-700 font-mono text-[11px]">
                                            <Icon icon="lucide:calendar" width={12} height={12} />
                                            {new Date(zine.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="bg-zinc-950/40 border border-zinc-900/60 p-8 rounded-2xl relative overflow-hidden group-hover:bg-rose-950/5 transition-all">
                                        <Icon icon="lucide:quote" className="text-rose-600/10 mb-4" width={40} height={40} />
                                        <p className="text-lg md:text-xl text-zinc-300 font-serif italic leading-relaxed relative z-10">
                                            &ldquo;{zine.content}&rdquo;
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-900 hover:border-rose-900/50 hover:bg-rose-950/20 transition-all group/res">
                                            <Icon icon="lucide:flame" width={16} height={16} className="text-rose-600 group-hover/res:animate-pulse" />
                                            <span className="text-xs font-black italic uppercase text-zinc-400 group-hover/res:text-rose-500">{zine.resonanceRating} RESONANCE</span>
                                        </button>
                                        <button className="text-xs font-black uppercase text-zinc-600 hover:text-white transition-colors">
                                            [ SIGNAL_BOOST ]
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-32 text-center">
                            <Icon icon="lucide:ghost" width={48} height={48} className="text-zinc-900 mx-auto mb-6" />
                            <p className="text-xl font-black text-zinc-800 uppercase italic">Silence in the Sector.</p>
                            <p className="text-[11px] font-mono text-zinc-700 uppercase mt-2">No entities have recorded memories of this artifact yet.</p>
                        </div>
                    )}
                </div>

                {/* Return CTA */}
                <div className="flex justify-center pt-20">
                    <Link
                        href={`/cinema/${id}/zines/post`}
                        className="bg-rose-600 text-black font-black italic text-2xl px-16 py-6 shadow-[10px_10px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-tighter"
                    >
                        INITIALIZE_NEW_ZINE
                    </Link>
                </div>

            </div>
        </MainLayout>
    );
}

