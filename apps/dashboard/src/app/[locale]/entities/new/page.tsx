
import React from 'react';
import { getDb, schema, isNull } from '@shimokitan/db';
import EntityForm from '../EntityForm';
import { Icon } from '@iconify/react';
import Link from '@/components/Link';
import { ensureUserSync } from '../../auth-helpers';
import { redirect } from 'next/navigation';

export default async function NewEntityPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    const user = await ensureUserSync();
    if (!user || (user.role !== 'founder' && user.role !== 'architect')) {
        redirect('/');
    }

    const db = getDb();

    const allEntities = db ? await db.query.entities.findMany({
        where: isNull(schema.entities.deletedAt),
        with: { translations: true, avatar: true }
    }) : [];

    const platforms = db ? await db.query.externalPlatforms.findMany({
        orderBy: (p, { asc }) => [asc(p.name)]
    }) : [];

    const entitySelectData = allEntities.map(e => ({
        id: e.id,
        name: e.translations?.[0]?.name || "Untitled",
        type: e.type,
        avatarUrl: e.avatar?.url
    }));

    return (
        <div className="space-y-6">
            <header className="flex items-end justify-between border-b border-zinc-900 pb-4">
                <div>
                    <Link 
                        href="/entities" 
                        className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all mb-4"
                    >
                        <Icon icon="lucide:arrow-left" width={14} />
                        Return_to_Registry
                    </Link>
                    <h1 className="text-2xl font-black italic tracking-tighter uppercase text-white">
                        Register <span className="text-violet-600">Entity.</span>
                    </h1>
                </div>
            </header>

            <section className="relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Icon icon="lucide:fingerprint" width={160} />
                </div>
                {/* No initialData passed means create mode */}
                <EntityForm 
                    entities={entitySelectData} 
                    platforms={platforms as any}
                />
            </section>
        </div>
    );
}
