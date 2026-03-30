
import React, { Suspense } from 'react';
import { getDb, schema } from '@shimokitan/db';
import ArtifactForm from '../../ArtifactForm';
import { isNull } from 'drizzle-orm';
import { Icon } from '@iconify/react';
import Link from '@/components/Link';
import { ensureUserSync } from '../../../auth-helpers';
import { redirect, notFound } from 'next/navigation';

const VALID_CATEGORIES = ['music', 'anime', 'game', 'illustration'];

export default async function NewCategoryArtifactPage(props: { params: Promise<{ locale: string, category: string }> }) {
    const { locale, category } = await props.params;

    if (!VALID_CATEGORIES.includes(category)) {
        notFound();
    }

    const user = await ensureUserSync();
    if (!user || (user.role !== 'founder' && user.role !== 'architect')) {
        redirect('/');
    }

    const db = getDb();
    if (!db) return <div>DB OFF</div>;

    const rawEntities = db ? await db.query.entities.findMany({
        where: isNull(schema.entities.deletedAt),
        with: {
            avatar: true,
            translations: true
        }
    }) : [];

    const entities = rawEntities.map(e => ({
        id: e.id,
        name: e.translations?.[0]?.name || "Untitled",
        type: e.type,
        avatarUrl: e.avatar?.url || null
    }));

    const platforms = db ? await db.query.externalPlatforms.findMany({
        orderBy: (p, { asc }) => [asc(p.name)]
    }) : [];

    const categoryLabels: Record<string, string> = {
        music: 'MUSIC_TRACK',
        anime: 'ANIME_FEATURE',
        game: 'GAME_ENTITY',
        illustration: 'ILLUSTRATION_WORK'
    };

    return (
        <div className="space-y-6">
            <header className="flex items-end justify-between border-b border-zinc-900 pb-4">
                <div>
                    <Link 
                        href="/artifacts/new" 
                        className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all mb-4"
                    >
                        <Icon icon="lucide:arrow-left" width={14} />
                        Return_to_Picker
                    </Link>
                    <h1 className="text-2xl font-black italic tracking-tighter uppercase text-white">
                        Register <span className="text-rose-600">{categoryLabels[category] || 'Artifact'}.</span>
                    </h1>
                </div>
            </header>

            <section className="relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-zinc-500">
                    <Icon icon="lucide:terminal" width={160} />
                </div>
                <Suspense fallback={
                    <div className="text-white font-mono text-xs animate-pulse p-12 text-center uppercase tracking-widest bg-zinc-950/20 border border-zinc-900">
                        Configuring_Interface...
                    </div>
                }>
                    <ArtifactForm
                        entities={entities as any}
                        userRole={user?.role}
                        platforms={platforms as any}
                        initialCategory={category}
                        isCategoryLocked={true}
                    />
                </Suspense>
            </section>
        </div>
    );
}
