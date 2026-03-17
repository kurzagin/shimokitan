
import React from 'react';
import { getDb, schema } from '@shimokitan/db';
import { Icon } from '@iconify/react';
import PlatformForm from './PlatformForm';
import { deletePlatform } from './actions';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PlatformsPage(props: { searchParams: Promise<{ id?: string }> }) {
    const searchParams = await props.searchParams;
    const db = getDb();
    if (!db) return <div>DB_STATION_OFFLINE</div>;

    const platforms = await db.query.externalPlatforms.findMany({
        orderBy: (p, { desc }) => [desc(p.createdAt)]
    });

    const editingPlatform = searchParams.id 
        ? platforms.find(p => p.id === searchParams.id)
        : undefined;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-rose-600"></div>
                        <span className="text-[10px] font-mono text-rose-500 uppercase tracking-[0.4em] font-black">Governance_Console</span>
                    </div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Network_Gateways</h1>
                    <p className="text-zinc-500 text-xs font-mono max-w-md leading-relaxed">
                        Centrally managing external platform definitions. Removing hardcoded identifiers to ensure the registry scales with the community.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Form Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="sticky top-24">
                        <PlatformForm initialData={editingPlatform as any} />
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Icon icon="lucide:list" className="text-zinc-600" width={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 font-mono">Registry_Entries</span>
                        <span className="bg-zinc-900 text-zinc-500 text-[8px] px-2 py-0.5 rounded font-black">{platforms.length}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {platforms.map((p) => (
                            <div 
                                key={p.id} 
                                className={`group bg-zinc-950/40 border rounded-xl p-5 hover:border-zinc-800 transition-all ${
                                    searchParams.id === p.id ? 'border-rose-900 bg-rose-900/10' : 'border-zinc-900'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div 
                                            className="w-10 h-10 rounded-lg flex items-center justify-center border border-zinc-800 bg-black group-hover:border-zinc-700 transition-all"
                                            style={{ boxShadow: `0 0 10px ${p.accentColor}22` }}
                                        >
                                            {p.iconUrl ? (
                                                <img src={p.iconUrl} alt={p.name} className="w-6 h-6 object-contain" />
                                            ) : (
                                                <Icon icon="lucide:globe" className="text-zinc-600" width={20} />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-black uppercase text-white tracking-tight">{p.name}</span>
                                                {!p.isActive && (
                                                    <span className="text-[7px] bg-zinc-900 text-zinc-600 px-1 py-0.5 rounded uppercase font-black">Inactive</span>
                                                )}
                                            </div>
                                            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">{p.id} // {p.category}</span>
                                        </div>
                                    </div>

                                    <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2">
                                        <Link 
                                            href={`?id=${p.id}`}
                                            className="text-zinc-600 hover:text-white p-2 border border-zinc-900 rounded bg-black/50 hover:border-zinc-700 transition-all"
                                        >
                                            <Icon icon="lucide:edit-2" width={12} />
                                        </Link>
                                        <form action={async () => {
                                            'use server';
                                            await deletePlatform(p.id);
                                        }}>
                                            <button className="text-zinc-600 hover:text-rose-500 p-2 border border-zinc-900 rounded bg-black/50 hover:border-rose-900/50 transition-all">
                                                <Icon icon="lucide:trash-2" width={12} />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-zinc-900/50 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.accentColor || '#666' }}></div>
                                        <span className="text-[8px] font-mono text-zinc-600 uppercase">{p.accentColor}</span>
                                    </div>
                                    <span className="text-[7px] font-mono text-zinc-700 uppercase">Registered: {new Date(p.createdAt || 0).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}

                        {platforms.length === 0 && (
                            <div className="md:col-span-2 py-24 border border-dashed border-zinc-900 rounded-xl flex flex-col items-center justify-center gap-4 bg-zinc-950/20">
                                <div className="w-12 h-12 bg-zinc-900/50 rounded-full flex items-center justify-center">
                                    <Icon icon="lucide:database-zap" className="text-zinc-700" width={24} />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Registry_Void_Detected</p>
                                    <p className="text-[8px] text-zinc-700 uppercase">Awaiting initial protocol declaration</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
