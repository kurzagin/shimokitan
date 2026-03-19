import React from 'react';
import WorkForm from '../WorkForm';
import { getDb, schema, eq } from '@shimokitan/db';
import { notFound } from 'next/navigation';
import { Icon } from '@iconify/react';
import Link from '@/components/Link';

export default async function EditWorkPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;
    const db = getDb();
    if (!db) return notFound();

    const work = await db.query.works.findFirst({
        where: eq(schema.works.id, id),
        with: {
            translations: true,
            media: {
                with: {
                    media: true
                }
            }
        }
    });

    if (!work) return notFound();

    return (
        <div className="space-y-8">
            <header className="space-y-4">
                <Link 
                    href="/works" 
                    className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                >
                    <Icon icon="lucide:arrow-left" width={14} />
                    Back_to_Registry
                </Link>
                <div className="space-y-1">
                    <h1 className="text-2xl font-black italic tracking-tighter uppercase text-white">
                        Upgrade_Signal: <span className="text-rose-600">IP_Anchor.</span>
                    </h1>
                    <p className="text-zinc-500 text-xs font-mono uppercase tracking-[0.2em]">Modifying canonical reference: {work.slug} {'//'} {id}</p>
                </div>
            </header>

            <WorkForm initialData={work} />
        </div>
    );
}
