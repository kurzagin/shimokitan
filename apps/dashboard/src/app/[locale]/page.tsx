import React from 'react';
export const dynamic = 'force-dynamic';
import { Icon } from '@iconify/react';
import { isNull, schema as dbSchema, getDb } from '@shimokitan/db';
import Link from '@/components/Link';
import { ensureUserSync } from './auth-helpers';
import { redirect } from 'next/navigation';
import { desc } from '@shimokitan/db';

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function ConsolePage({ params }: PageProps) {
    const db = getDb();
    const { locale } = await params;

    if (!db) return <div>DB Connection Failed</div>;

    const user = await ensureUserSync();
    if (!user) {
        redirect('/auth/signin?callbackUrl=/');
    }
    const currentRole = (user.role as string)?.toUpperCase() || 'GHOST';
    const isFounder = currentRole === 'FOUNDER';

    if (!isFounder) {
        return (
            <div className="p-12 border border-rose-900 bg-rose-950/20 text-center space-y-4 m-10">
                <Icon icon="lucide:shield-alert" width={48} className="mx-auto text-rose-600" />
                <h2 className="text-2xl font-black text-white italic uppercase">Access_Denied</h2>
                <p className="text-zinc-500 text-xs font-mono">Insufficient_Privileges // Sector_Founders_Only</p>
                <Link href="/" className="inline-block text-rose-500 underline underline-offset-4 text-xs font-black uppercase">Return_To_Base</Link>
            </div>
        );
    }

    // Fetch All Data for Metrics
    const [allArtifacts, allWorks, entities, verifications, exhibits] = await Promise.all([
        db.query.artifacts.findMany({
            columns: { id: true, status: true, category: true, deletedAt: true }
        }),
        db.query.works.findMany({
             columns: { id: true, deletedAt: true }
        }),
        db.query.entities.findMany({ where: isNull(dbSchema.entities.deletedAt), columns: { id: true } }),
        db.query.verificationRegistry.findMany({
            where: (v, { eq }) => eq(v.status, 'pending'),
            columns: { id: true }
        }),
        db.query.exhibits.findMany({
            columns: { id: true }
        }),
    ]);

    // Process Metrics
    const activeArtifacts = allArtifacts.filter(a => !a.deletedAt);
    const activeWorks = allWorks.filter(w => !w.deletedAt);
    
    const categoryCounts = activeArtifacts.reduce((acc, curr) => {
        const c = curr.category || 'other';
        acc[c] = (acc[c] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const totalActive = activeArtifacts.length;

    // Recent Global Activity
    const recentArtifacts = await db.query.artifacts.findMany({
        where: (art, { isNull }) => isNull(art.deletedAt),
        limit: 5,
        orderBy: [desc(dbSchema.artifacts.createdAt)],
        with: {
            translations: {
                where: (t, { eq }) => eq(t.locale, locale as any)
            },
        }
    });

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            {/* Content Header */}
            <header className="flex justify-between items-start mb-12">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">System_Status: <span className="text-rose-600">Operational.</span></h2>
                    <p className="text-zinc-500 text-xs font-mono tracking-[0.2em] uppercase">District {locale} // Identity: {user.name} // Permissions: {currentRole}</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="bg-zinc-950/50 border border-zinc-950 p-4 rounded-xl backdrop-blur-md">
                        <div className="text-[10px] font-mono text-zinc-600 uppercase mb-1">System_Render_Time</div>
                        <div className="text-sm font-black text-white font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                </div>
            </header>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="relative group overflow-hidden bg-zinc-950 border border-zinc-900 p-6 rounded-2xl hover:border-rose-900/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                        <Icon icon="lucide:library" width={64} />
                    </div>
                    <div className="relative z-10">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">IP_Anchor_Active</div>
                        <div className="text-4xl font-black text-white italic">{activeWorks.length}</div>
                        <div className="mt-4 flex items-center gap-2">
                             <span className="text-[9px] px-1.5 py-0.5 bg-rose-600/10 text-rose-500 rounded font-black">STABLE</span>
                        </div>
                    </div>
                </div>

                <div className="relative group overflow-hidden bg-zinc-950 border border-zinc-900 p-6 rounded-2xl hover:border-blue-900/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                        <Icon icon="lucide:package" width={64} />
                    </div>
                    <div className="relative z-10">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Artifacts_Registry</div>
                        <div className="text-4xl font-black text-white italic">{totalActive}</div>
                        <div className="mt-4 flex items-center gap-4 text-[9px] font-mono uppercase text-zinc-600">
                             <span>Music: {categoryCounts.music || 0}</span>
                             <span>Anime: {categoryCounts.anime || 0}</span>
                             <span>Game: {categoryCounts.game || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="relative group overflow-hidden bg-zinc-950 border border-zinc-900 p-6 rounded-2xl hover:border-emerald-900/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                        <Icon icon="lucide:users" width={64} />
                    </div>
                    <div className="relative z-10">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Resident_Entities</div>
                        <div className="text-4xl font-black text-white italic">{entities.length}</div>
                        <div className="mt-4 flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-emerald-500 font-black">ONLINE</span>
                        </div>
                    </div>
                </div>

                <div className="relative group overflow-hidden bg-zinc-950 border border-zinc-900 p-6 rounded-2xl hover:border-violet-900/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                        <Icon icon="lucide:shield-check" width={64} />
                    </div>
                    <div className="relative z-10">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Audit_Protocol_Pending</div>
                        <div className="text-4xl font-black text-white italic">{verifications.length}</div>
                        <div className="mt-4">
                             <Link href="/verifications" className="text-[9px] font-black uppercase text-violet-500 hover:text-white transition-colors underline underline-offset-4">Process_Queue_Entry &gt;</Link>
                        </div>
                    </div>
                </div>

                <div className="relative group overflow-hidden bg-zinc-950 border border-zinc-900 p-6 rounded-2xl hover:border-amber-900/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                        <Icon icon="lucide:archive" width={64} />
                    </div>
                    <div className="relative z-10">
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">Archival_Exhibits</div>
                        <div className="text-4xl font-black text-white italic">{exhibits?.length || 0}</div>
                        <div className="mt-4 flex items-center gap-2">
                             <span className="text-[9px] px-1.5 py-0.5 bg-amber-600/10 text-amber-500 rounded font-black tracking-widest uppercase">The_Context</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity & Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 border border-zinc-900 bg-zinc-950/40 p-6">
                    <h4 className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-6">Recent_Transmission_Logs</h4>
                    <div className="space-y-4">
                        {recentArtifacts.map(art => (
                            <div key={art.id} className="flex items-center gap-4 text-xs font-mono border-b border-zinc-900 pb-2">
                                <span className="text-zinc-700">[{art.id.slice(0, 8)}]</span>
                                <span className="text-rose-500 uppercase">{art.status}</span>
                                <span className="text-white truncate">{art.translations?.[0]?.title || 'Untitled'}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="border border-zinc-900 bg-zinc-950/40 p-6">
                    <h4 className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-6">System_Status</h4>
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <div className="flex justify-between text-[9px] uppercase font-black">
                                <span>R2_Latency</span>
                                <span className="text-emerald-500">Minimal</span>
                            </div>
                            <div className="h-0.5 w-full bg-zinc-900">
                                <div className="h-full bg-emerald-500 w-[12%]" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[9px] uppercase font-black">
                                <span>DB_Load</span>
                                <span className="text-zinc-500">Idle</span>
                            </div>
                            <div className="h-0.5 w-full bg-zinc-900">
                                <div className="h-full bg-zinc-700 w-[4%]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
