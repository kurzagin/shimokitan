
import React from 'react';
export const dynamic = 'force-dynamic';
import { Icon } from '@iconify/react';
import { isNull, schema as dbSchema, getDb } from '@shimokitan/db';
import Link from '@/components/Link';
import { ensureUserSync } from '../auth-helpers';
import { redirect } from 'next/navigation';
import { desc } from '@shimokitan/db';

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function WorkbenchPage({ params }: PageProps) {
    const db = getDb();
    if (!db) return <div>DB Connection Failed</div>;

    const user = await ensureUserSync();
    if (!user) {
        redirect('/auth/signin?callbackUrl=/pedalboard/workbench');
    }
    const currentRole = (user.role as string)?.toUpperCase() || 'GHOST';
    const isFounder = currentRole === 'FOUNDER';
    const isArchitect = currentRole === 'ARCHITECT' || isFounder;

    if (!isArchitect) {
        return (
            <div className="p-12 border border-rose-900 bg-rose-950/20 text-center space-y-4">
                <Icon icon="lucide:lock" width={48} className="mx-auto text-rose-600" />
                <h2 className="text-2xl font-black text-white italic uppercase">Workbench_Locked</h2>
                <p className="text-zinc-500 text-xs font-mono">Signal_Extraction_Unauthorized // Architects_Only</p>
                <Link href="/pedalboard" className="inline-block text-rose-500 underline underline-offset-4 text-xs font-black uppercase">Return_To_Entities_Feed</Link>
            </div>
        );
    }

    // Fetch Portfolio Data (User Specific - TODO: Filter by author when schema confirms)
    // Currently fetches global recent similar to original implementation but conceptually should be user's.
    // For now, mirroring original behavior effectively to complete refactor first.
    const myPortfolio = await db.query.artifacts.findMany({
        where: (art, { isNull }) => isNull(art.deletedAt),
        limit: 4,
        orderBy: [desc(dbSchema.artifacts.createdAt)],
        with: {
            translations: {
                where: (t, { eq }) => eq(t.locale, 'en')
            },
            zines: true
        }
    });

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-zinc-900 pb-8">
                <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Artist_Workbench</h2>
                    <p className="text-zinc-500 text-[10px] font-mono tracking-[0.2em] uppercase mt-1">Creation & Deployment Monitor</p>
                </div>
                <Link href="/pedalboard/zines" className="bg-rose-600 text-white px-5 py-3 text-xs font-black uppercase tracking-widest hover:bg-rose-500 transition-all flex items-center gap-2">
                    <Icon icon="lucide:plus" width={14} />
                    Manage_Signals
                </Link>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">My_Portfolio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myPortfolio.map(art => (
                            <Link key={art.id} href={`/pedalboard/zines`} className="bg-zinc-900/30 border border-zinc-800 p-6 flex flex-col justify-between h-48 group hover:border-zinc-700 transition-all">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">{art.category}</span>
                                            <span className="text-[10px] font-mono text-rose-500 uppercase tracking-tighter">[{art.zines?.length || 0} Zines]</span>
                                        </div>
                                        <span className="text-[8px] font-bold px-1.5 py-0.5 bg-emerald-500 text-emerald-950">
                                            LIVE
                                        </span>
                                    </div>
                                    <div className="text-xl font-black text-white uppercase group-hover:text-rose-500 transition-colors italic">{art.translations?.[0]?.title || 'Untitled'}</div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="text-[10px] font-mono text-zinc-600 uppercase transition-colors underline underline-offset-4 group-hover:text-white">Edit_Artifact_&_Emit_Signals</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Artist_Meta</h3>
                    <div className="bg-black border border-zinc-900 p-6 space-y-6">
                        <div>
                            <div className="text-[10px] font-mono text-zinc-600 uppercase mb-1">Total_Impressions</div>
                            <div className="text-3xl font-black text-white tracking-tighter italic">0</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-mono text-zinc-600 uppercase mb-1">Artist_Resonance</div>
                            <div className="text-3xl font-black text-emerald-500 tracking-tighter italic">+0%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
