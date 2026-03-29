import React from 'react';
import { Icon } from '@iconify/react';
import { MainLayout } from '@/components/layout/MainLayout';
import { getDb, schema, desc } from '@shimokitan/db';
import Link from 'next/link';
import { getDictionary, Locale } from "@shimokitan/utils";
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const locale = (await params).locale as Locale;
    const dict = getDictionary(locale);
    return {
        title: dict.navigation.zines,
    };
}

export default async function PublicZinesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const db = getDb();
    if (!db) return <div>DB_CONNECTION_ERROR</div>;

    const zines = await db.query.zines.findMany({
        orderBy: [desc(schema.zines.createdAt)],
        with: {
            artifact: true,
            author: true,
            translations: true
        }
    });

  return (
    <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">

      {/* Header: The Collective Pulse */}
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-12 bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.5)]" />
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none py-1">
            PUBLIC_<span className="text-rose-600">ZINES</span>
          </h1>
        </div>
        <p className="max-w-2xl font-mono text-zinc-500 text-xs uppercase tracking-widest leading-relaxed">
          The collective pulse of the District. Fragmented memories triggered by artifacts. Identity through resonance.
        </p>
      </header>

      {/* Zine Stream */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {zines.map((zine: any) => {
          return (
            <div key={zine.id} className="bg-zinc-950/20 border border-zinc-900 rounded-2xl p-8 flex flex-col gap-8 relative overflow-hidden group hover:border-rose-900/30 transition-all duration-700">
              {/* Artifact Reference */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Resonating With //</span>
                <Link href={`/cinema/${zine.artifactId}`} className="text-xl font-black uppercase italic group-hover:text-rose-500 transition-colors truncate">
                  {zine.artifact?.title || "Unknown Shard"}
                </Link>
              </div>

              {/* The Content */}
              <div className="relative z-10">
                <Icon icon="lucide:quote" className="text-rose-600/20 mb-4" width={32} height={32} />
                <p className="text-zinc-400 font-serif italic text-lg leading-relaxed">
                  &ldquo;{zine.translations?.[0]?.content || "Signal fragmentation detected..."}&rdquo;
                </p>
              </div>

              {/* Author & Resonance */}
              <div className="mt-auto pt-8 border-t border-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center p-0 overflow-hidden">
                    {zine.author?.avatarUrl ? (
                      <img src={zine.author.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      <Icon icon="lucide:user" className="text-zinc-600" width={18} height={18} />
                    )
                    }
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase text-zinc-200">{zine.author?.name || "Resident"}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5 text-rose-600 font-black italic">
                    <Icon icon="lucide:flame" width={14} height={14} />
                    <span>{zine.resonance}</span>
                  </div>
                  <span className="text-[8px] font-mono text-zinc-700 uppercase">{new Date(zine.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 p-16 bg-zinc-950 border border-zinc-900 rounded-3xl flex flex-col items-center text-center gap-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(225,29,72,0.1),transparent_70%)]" />
        <div className="relative z-10 flex flex-col gap-4">
          <Icon icon="lucide:message-square-plus" width={48} height={48} className="text-rose-600 mx-auto" />
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">Your Echo is Missing.</h2>
          <p className="text-zinc-500 font-mono text-xs uppercase max-w-md mx-auto leading-relaxed">
            Find an artifact in the district and answer the call. Zines are the exclusive response to the prompt of lived experience.
          </p>
        </div>
        <Link href="/cinema" className="relative z-10 bg-white text-black font-black italic text-xl px-12 py-4 shadow-[8px_8px_0px_rgba(225,29,72,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-tighter">
          Find Artifact
        </Link>
      </div>

    </div>
  );
}

