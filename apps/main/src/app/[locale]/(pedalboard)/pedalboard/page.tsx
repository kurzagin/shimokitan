
import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Pedalboard",
};

export const dynamic = 'force-dynamic';
import { Icon } from '@iconify/react';
import { isNull, schema as dbSchema, getDb } from '@shimokitan/db';
import Link from '@/components/Link';
import { auth } from '@shimokitan/auth';
import { RequestAccessButton } from './_components/RequestAccessButton';
import { ensureUserSync } from './auth-helpers';
import { redirect } from 'next/navigation';
import { getOptimizedImageUrl } from '@shimokitan/utils';
import { desc, and } from '@shimokitan/db';
import { Fragment } from 'react';

interface PageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PedalboardPage({ params, searchParams }: PageProps) {
    const db = getDb();
    if (!db) return <div>DB Connection Failed</div>;

    const [{ locale }] = await Promise.all([params]);

    // Real Auth Integration & User Provisioning
    const user = await ensureUserSync();
    if (!user) {
        redirect('/auth/signin?callbackUrl=/pedalboard');
    }
    const currentRole = (user.role as string)?.toUpperCase() || 'GHOST';

    // Fetch User Profile Data
    const userProfile = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, user.id),
    });

    const profileData = {
        name: userProfile?.name || user?.name || 'GHOST_SIGNAL',
        status: userProfile?.status || '',
        bio: userProfile?.bio || 'A digital resident of Shimokitazawa.',
        handle: user?.email?.split('@')[0] || 'unknown'
    };

    const isFounder = currentRole === 'FOUNDER';
    const isArchitect = currentRole === 'ARCHITECT' || isFounder;

    // Fetch Zine Feed (Real)
    const zineFeedFromDb = await db.query.zines.findMany({
        where: (z, { isNull }) => isNull(z.deletedAt),
        orderBy: [desc(dbSchema.zines.createdAt)],
        limit: 10,
        with: {
            translations: {
                where: (t, { eq }) => eq(t.locale, 'en')
            },
            author: true,
            artifact: {
                with: {
                    translations: {
                        where: (t, { eq }) => eq(t.locale, 'en')
                    },
                    tags: {
                        with: {
                            tag: {
                                with: {
                                    translations: {
                                        where: (t, { eq }) => eq(t.locale, 'en')
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const formattedZineFeed = zineFeedFromDb.map(z => ({
        id: z.id,
        title: z.artifact?.translations?.[0]?.title || 'Unknown Artifact',
        artifact: z.artifact?.translations?.[0]?.title || 'UNSET',
        content: z.translations?.[0]?.content || 'Signal fragmentation detected...',
        author: z.author?.name || 'Anonymous',
        updatedAt: 'recently', // Simplified for now
        views: '0',
        heat: `+${z.resonance || 0}`,
        tags: z.artifact?.tags?.map(t => `#${t.tag.translations?.[0]?.name}`).slice(0, 2) || []
    }));

    // --- MODE: RESIDENT (Public Persona / Twitter Style) ---

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">
            {/* Profile Header Block */}
            <section className="relative">
                <div className="h-48 md:h-64 bg-zinc-900 border border-zinc-800 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px]" />
                </div>

                <div className="px-6 md:px-10 -mt-16 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex flex-col md:flex-row md:items-end gap-6">
                        <div className="w-32 h-32 md:w-40 md:h-40 bg-black border-4 border-[#050505] relative shadow-2xl">
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600 overflow-hidden">
                                <Icon icon="lucide:user" width={64} />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-rose-600 flex items-center justify-center text-white border-2 border-black">
                                <Icon icon="lucide:check-circle-2" width={16} />
                            </div>
                        </div>

                        <div className="mb-2">
                            <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                                {profileData.name}
                            </h1>
                            <p className="text-zinc-500 font-mono text-xs mt-2 uppercase tracking-widest flex items-center gap-2">
                                @{profileData.handle} // {currentRole}_SECTOR
                                {profileData.status && (
                                    <>
                                        <span className="text-zinc-800">//</span>
                                        <span className="text-rose-500 italic lowercase">{profileData.status}</span>
                                    </>
                                )}
                            </p>
                            <p className="text-zinc-400 text-sm mt-4 max-w-xl leading-relaxed italic">
                                "{profileData.bio}"
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-2">
                        {/* Inline Update is better for Phase 1 */}
                        <Link locale={locale} href="/pedalboard/profile/edit" className="bg-rose-600 text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-rose-500 transition-all">
                            Edit_Persona
                        </Link>
                        <button className="bg-black border border-zinc-800 text-zinc-400 p-2.5 hover:text-white transition-all">
                            <Icon icon="lucide:share-2" width={18} />
                        </button>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-6 md:px-10">
                {/* Main Feed Column */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex gap-8 border-b border-zinc-900">
                        <button className="pb-4 text-xs font-black uppercase tracking-widest border-b-2 border-rose-600 text-white">Signal_Feed</button>
                        <button className="pb-4 text-xs font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors">Digital_Shelf</button>
                    </div>

                    <div className="space-y-0 -mx-6 md:-mx-0">
                        {formattedZineFeed.length > 0 ? formattedZineFeed.map((zine) => (
                            <div key={zine.id} className="p-6 md:p-8 border-b border-zinc-900 hover:bg-zinc-900/10 transition-colors group relative">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-zinc-800 shrink-0 border border-zinc-700" />

                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-white uppercase tracking-tight italic">{zine.author}</span>
                                                <span className="text-zinc-700">·</span>
                                                <span className="text-[10px] font-mono text-zinc-600">{zine.updatedAt}</span>
                                            </div>
                                            <div className="text-[8px] font-mono text-zinc-700 uppercase px-2 py-0.5 border border-zinc-900">
                                                Signal // {zine.artifact}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter group-hover:text-rose-500 transition-colors">
                                                {zine.title}
                                            </h3>
                                            <p className="text-zinc-400 text-sm leading-relaxed">
                                                {zine.content}
                                            </p>
                                        </div>

                                        <div className="flex gap-3">
                                            {zine.tags.map(tag => (
                                                <span key={tag} className="text-[10px] font-mono text-rose-600/60 uppercase tracking-tighter">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-8 pt-4">
                                            <div className="flex items-center gap-2 text-zinc-700">
                                                <Icon icon="lucide:flame" width={14} />
                                                <span className="text-[10px] font-mono tracking-widest">{zine.heat}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-700">
                                                <Icon icon="lucide:bar-chart-2" width={14} />
                                                <span className="text-[10px] font-mono tracking-widest">{zine.views}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="p-20 text-center border-b border-zinc-900">
                                <Icon icon="lucide:radio" width={48} className="mx-auto text-zinc-800 mb-4" />
                                <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">No_Active_Signals_Detected</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-8">
                    {/* CTA: Be an Architect (Locked for non-architects) */}
                    {!isArchitect && (
                        <div className="bg-rose-950/10 border border-rose-900/40 p-8 space-y-6 animate-in zoom-in-95 duration-700">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Be an Architect</h3>
                                <p className="text-xs text-rose-300/60 leading-relaxed font-medium">
                                    Unlock the professional <b>Workbench</b>. Submit your portfolio for verification and begin emitting Signals through artifacts.
                                </p>
                            </div>
                            <RequestAccessButton />
                        </div>
                    )}

                    {/* Station Control Section */}
                    <div className="bg-black border border-zinc-900 p-8 space-y-8">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                            <div className="text-xs font-black uppercase tracking-widest text-white">Station_Control</div>
                            <Icon icon="lucide:terminal" width={14} className="text-zinc-600" />
                        </div>

                        {/* Founder-specific Block */}
                        {isFounder && (
                            <div className="space-y-4">
                                <Link href="/pedalboard/console" className="border-zinc-800 flex items-center justify-between group p-3 border bg-zinc-900/20 hover:border-rose-700 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Icon icon="lucide:database-zap" width={16} className="text-rose-600" />
                                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white">System_Console</span>
                                    </div>
                                    <Icon icon="lucide:chevron-right" width={14} className="text-zinc-800" />
                                </Link>
                            </div>
                        )}

                        {/* Architect+ Block */}
                        {isArchitect && (
                            <div className="space-y-4">
                                <Link href="/pedalboard/workbench" className="border-zinc-800 flex items-center justify-between group p-3 border bg-zinc-900/20 hover:border-blue-700 transition-all">
                                    <div className="flex items-center gap-3">
                                        <Icon icon="lucide:layout-dashboard" width={16} className="text-blue-600" />
                                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white">Workbench_Terminal</span>
                                    </div>
                                    <Icon icon="lucide:chevron-right" width={14} className="text-zinc-800" />
                                </Link>
                            </div>
                        )}

                        <div className="space-y-1">
                            <div className="text-[10px] font-mono text-zinc-700 uppercase mb-4 px-1">Internal_Registry</div>
                            {[
                                { label: 'Zine_Feed', icon: 'lucide:package', href: '/pedalboard/zines' },
                                { label: 'Collections', icon: 'lucide:users', href: '/pedalboard/collections' },
                                { label: 'Digital_Tags', icon: 'lucide:tags', href: '/pedalboard/tags' },
                            ].map((item) => (
                                <Link key={item.label} href={item.href} className="flex items-center gap-3 p-3 text-zinc-500 hover:text-white hover:bg-zinc-950 transition-all group">
                                    <Icon icon={item.icon} width={14} className="text-zinc-700 group-hover:text-rose-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
