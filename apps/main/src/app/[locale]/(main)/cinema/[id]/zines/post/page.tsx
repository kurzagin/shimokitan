import React from 'react';
import { Icon } from '@iconify/react';
import { MainLayout } from '@/components/layout/MainLayout';
import Link from '@/components/Link';
import { Badge } from '@shimokitan/ui';
import { getArtifactById, resolveTranslation } from '@shimokitan/db';
import { notFound } from 'next/navigation';
import ZineCreateForm from '@/components/zines/ZineCreateForm';
import { getDictionary, Locale } from "@shimokitan/utils";

export default async function PostZinePage(props: { 
    params: Promise<{ locale: string; id: string }>;
    searchParams: Promise<{ exhibit?: string }>;
}) {
    const { locale, id } = await props.params;
    const { exhibit: exhibitId } = await props.searchParams;
    const dict = getDictionary(locale as Locale);
    const artifact = await getArtifactById(id);

    if (!artifact) {
        notFound();
    }

    const title = resolveTranslation(artifact.translations, locale)?.title || "Untitled";

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto py-12 animate-in fade-in zoom-in-95 duration-700">

                {/* Protocol Header */}
                <div className="flex flex-col gap-6 mb-20">
                    <div className="flex items-center justify-between">
                        <Link href={`/cinema/${id}${exhibitId ? `?exhibit=${exhibitId}` : ''}`} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors group">
                            <Icon icon="lucide:arrow-left" width={14} height={14} className="group-hover:-translate-x-1 transition-transform" />
                            {dict.cinema.return_to_fragment}
                        </Link>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-rose-600 animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-rose-600" />
                            RESONANCE_STATION // LIVE
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 border-l-4 border-rose-600 pl-8">
                        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-[0.5em]">Transmitting_Memoir //</span>
                        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none py-1">
                            CASTING_<span className="text-rose-600">ECHO</span>
                        </h1>
                    </div>
                </div>

                {/* The Artifact Card - Small Reference */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 flex items-center gap-6 mb-16">
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-zinc-800 shrink-0">
                        <img src={(artifact as any).cover?.url || undefined} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-mono text-zinc-600 uppercase">Targeting Artifact //</span>
                        <h2 className="text-xl font-black uppercase italic text-zinc-100">{title}</h2>
                        <Badge variant="zinc" className="w-fit">{artifact.category.toUpperCase()}</Badge>
                    </div>
                </div>

                {/* Client Form */}
                <ZineCreateForm artifactId={artifact.id} exhibitId={exhibitId} />

                {/* Footer Decor */}
                <div className="mt-32 opacity-[0.05] pointer-events-none select-none overflow-hidden">
                    <span className="text-[100px] md:text-[150px] font-black uppercase italic tracking-tighter leading-none whitespace-nowrap block">RESONANCE</span>
                </div>

            </div>
        </MainLayout>
    );
}

