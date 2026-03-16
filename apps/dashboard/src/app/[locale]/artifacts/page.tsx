
import React from 'react';
export const dynamic = 'force-dynamic';
import { Icon } from '@iconify/react';
import { getDb, schema, desc } from '@shimokitan/db';
import ArtifactRegistry from './components/ArtifactRegistry';
import { deleteArtifact } from '../actions/artifacts';

import { isNull, isNotNull } from 'drizzle-orm';
import Link from '@/components/Link';
import AnilistGlobalSearch from './components/AnilistGlobalSearch';
import { ensureUserSync } from '../auth-helpers';
import { redirect } from 'next/navigation';

export default async function ArtifactsPage(props: { params: Promise<{ locale: string }>, searchParams: Promise<{ trash?: string }> }) {
    const { locale } = await props.params;
    const user = await ensureUserSync();
    if (!user || (user.role !== 'founder' && user.role !== 'architect')) {
        redirect('/');
    }

    const searchParams = await props.searchParams;
    const isTrash = searchParams.trash === 'true';

    // Fetch Entities for the credits selector
    const db = getDb();
    const rawEntities = db ? await db.query.entities.findMany({
        where: isNull(schema.entities.deletedAt),
        with: {
            translations: true
        }
    }) : [];

    const entities = rawEntities.map(e => ({
        id: e.id,
        name: e.translations?.[0]?.name || "Untitled",
        type: e.type
    }));

    const rawArtifacts = db ? await db.query.artifacts.findMany({
        where: isTrash ? isNotNull(schema.artifacts.deletedAt) : isNull(schema.artifacts.deletedAt),
        orderBy: [desc(schema.artifacts.createdAt)],
        with: {
            translations: true,
            exhibits: {
                columns: { id: true }
            }
        }
    }) : [];

    const allArtifacts = rawArtifacts.map(a => ({
        ...a,
        title: a.translations?.[0]?.title || "Untitled",
        exhibitCount: a.exhibits?.length || 0
    }));

    return (
        <div className="space-y-6">
            <header className="flex items-end justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
                        Artifact <span className="text-rose-600">Registry.</span>
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.2em] mt-1">
                        {isTrash ? 'Recover or permanently purge entries.' : 'Central management for all system artifacts.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {!isTrash && (
                        <div className="flex gap-2">
                            <AnilistGlobalSearch />
                            <Link
                                href="/artifacts/new"
                                className="flex items-center gap-2 bg-white text-black text-[10px] font-black uppercase px-4 py-2 hover:bg-rose-600 hover:text-white transition-all shadow-lg"
                            >
                                <Icon icon="lucide:plus" width={14} />
                                REGISTER_ARTIFACT
                            </Link>
                        </div>
                    )}
                    <Link
                        href={isTrash ? '/artifacts' : '/artifacts?trash=true'}
                        className={`text-[10px] font-black uppercase px-4 py-2 border transition-colors ${isTrash ? 'bg-rose-600 border-rose-600 text-white hover:bg-white hover:text-black' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'}`}
                    >
                        {isTrash ? 'VIEW_ACTIVE' : 'VIEW_TRASH'}
                    </Link>
                </div>
            </header>

            <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
                    <Icon icon={isTrash ? "lucide:trash-2" : "lucide:database"} className={isTrash ? "text-rose-500" : "text-zinc-500"} width={18} />
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">
                        {isTrash ? 'TRASH_PURGE' : 'Active_Registry'}
                    </h2>
                </div>

                <div className="bg-zinc-950/20 rounded-lg p-1 border border-zinc-900">
                    <ArtifactRegistry data={allArtifacts} isTrash={isTrash} />
                </div>
            </section>
        </div>
    );
}
