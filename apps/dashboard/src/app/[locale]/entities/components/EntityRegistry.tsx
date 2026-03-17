
"use client"

import React from 'react';
import RegistryTable from '@/components/RegistryTable';
import { deleteEntity, purgeEntity, restoreEntity } from '../../actions';

export default function EntityRegistry({ data, isTrash = false }: { data: any[], isTrash?: boolean }) {
    return (
        <RegistryTable
            data={data}
            onDelete={isTrash ? purgeEntity : deleteEntity}
            onRestore={isTrash ? restoreEntity : undefined}
            deleteProps={isTrash ? {
                confirmMessage: 'PERMANENT_PURGE_WARNING: THIS_IDENTITY_WILL_BE_ERASED_FROM_ALL_LEDGERS. CONTINUE?',
                title: 'PURGE_PERMANENTLY'
            } : undefined}
            editUrl={(row) => `/entities/${row.id}`}
            columns={[
                { key: 'name', label: 'Name', render: (val) => <span className="font-bold text-white uppercase tracking-tight">{val}</span> },
                { key: 'type', label: 'Type', render: (val) => <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-300">{val}</span> },
                { key: 'civilStatus', label: 'Civil_Status', render: (val) => (
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm border ${val === 'resident' ? 'bg-violet-900/20 border-violet-800 text-violet-400' : 'bg-rose-900/20 border-rose-800 text-rose-400'}`}>
                        {val === 'resident' ? 'RESIDENT' : 'SEALED'}
                    </span>
                )},
                { key: 'avatarUrl', label: 'Avatar', render: (val) => val ? <img src={val} className="w-8 h-8 rounded-full border border-zinc-800" /> : <div className="w-8 h-8 bg-zinc-900 rounded-full border border-zinc-800" /> }
            ]}
        />
    );
}
