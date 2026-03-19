
import React, { Suspense } from 'react';
import { getDb, schema, eq, isNull } from '@shimokitan/db';
import ArtifactForm from '../ArtifactForm';
import { Icon } from '@iconify/react';
import Link from '@/components/Link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditArtifactPage(props: { params: Promise<{ locale: string; id: string }> }) {
    const params = await props.params;
    const db = getDb();

    const artifact = db ? await db.query.artifacts.findFirst({
        where: eq(schema.artifacts.id, params.id),
        with: {
            credits: true,
            resources: true,
            translations: true,
            media: {
                with: {
                    media: true
                }
            },
            sourceArtifact: {
                with: {
                    translations: true
                }
            },
            tags: {
                with: {
                    tag: {
                        with: {
                            translations: true
                        }
                    }
                }
            },
            exhibits: {
                with: {
                    translations: true,
                    media: true
                }
            }
        }
    }) : null;

    if (!artifact) {
        notFound();
    }

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

    return (
        <div className="max-w-4xl mx-auto py-12">
            <header className="mb-12 flex items-start justify-between">
                <div>
                    <Link 
                        href="/artifacts" 
                        className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all mb-4"
                    >
                        <Icon icon="lucide:arrow-left" width={14} />
                        Return_to_Registry
                    </Link>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
                        Modify_Artifact <span className="text-rose-600">// {params.id}</span>
                    </h1>
                    <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Update existing registry entry with verified metadata.</p>
                </div>

                <div className="flex gap-2">
                    <Link href={`/artifacts/${params.id}/zines`} className="bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                        <Icon icon="lucide:message-square" width={14} />
                        Zines_Registry
                    </Link>
                    <Link href={`/artifacts/${params.id}`} target="_blank" className="bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                        <Icon icon="lucide:external-link" width={14} />
                        Live_View
                    </Link>
                </div>
            </header>

            <Suspense fallback={<div className="text-white font-mono text-xs animate-pulse p-12 text-center uppercase tracking-widest bg-zinc-950/20 border border-zinc-900">Configuring_Interface...</div>}>
                <ArtifactForm
                    key={`${artifact.id}-${artifact.updatedAt?.getTime() || 'new'}`}
                    entities={entities}
                    initialData={artifact}
                    platforms={platforms as any}
                />
            </Suspense>
        </div>
    );
}
