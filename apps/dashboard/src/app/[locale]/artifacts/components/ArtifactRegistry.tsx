
"use client"

import React from 'react';
import RegistryTable from '@/components/RegistryTable';
import { deleteArtifact, purgeArtifact, restoreArtifact } from '../../actions/artifacts';

export default function ArtifactRegistry({ data, isTrash = false }: { data: any[], isTrash?: boolean }) {
    return (
        <RegistryTable
            data={data}
            onDelete={isTrash ? purgeArtifact : deleteArtifact}
            onRestore={isTrash ? restoreArtifact : undefined}
            deleteProps={isTrash ? {
                confirmMessage: 'PERMANENT_PURGE_WARNING: THIS_ACTION_CANNOT_BE_REVERSED. CONTINUE?',
                title: 'PURGE_PERMANENTLY'
            } : undefined}
            editUrl={(row) => `/artifacts/${row.id}`}
            columns={[
                { key: 'title', label: 'TITLE_IDENTIFIER', render: (val) => <span className="font-bold text-white uppercase tracking-tight">{val}</span> },
                { key: 'category', label: 'CATEGORY', render: (val) => <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400">{val}</span> },
                {
                    key: 'status', label: 'STATUS', render: (val) => (
                        <span className={`text-[10px] font-black uppercase ${val === 'back_alley' ? 'text-emerald-500' : val === 'the_pit' ? 'text-rose-600' : 'text-zinc-600'}`}>
                            {val === 'back_alley' ? 'LIVE' : val === 'the_pit' ? 'FEATURED (THE PIT)' : val}
                        </span>
                    )
                },
                { key: 'exhibitCount', label: 'EXHIBITS', render: (val) => <span className="text-zinc-500 font-mono">[{val}]</span> },
                { key: 'resonance', label: 'RESONANCE_HEAT', render: (val) => <span className="text-zinc-500 font-mono">[{val}]</span> }
            ]}
        />
    );
}
