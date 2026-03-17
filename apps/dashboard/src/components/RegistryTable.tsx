
"use client"

import React from 'react';
import { Icon } from '@iconify/react';
import Link from '@/components/Link';
import DeleteButton from './DeleteButton';
import RestoreButton from './RestoreButton';

export default function RegistryTable<T extends { id: string }>({
    data,
    columns,
    onDelete,
    deleteProps = {},
    onRestore,
    editUrl,
    actions = true
}: {
    data: T[],
    columns: { key: string, label: string, render?: (val: any, row: T) => React.ReactNode }[],
    onDelete?: (id: string) => Promise<void | any>,
    deleteProps?: { confirmMessage?: string, title?: string },
    onRestore?: (id: string) => Promise<void | any>,
    editUrl?: (row: T) => string,
    actions?: boolean
}) {
    const [selected, setSelected] = React.useState<string[]>([]);
    const [search, setSearch] = React.useState('');

    const filteredData = React.useMemo(() => {
        if (!search) return data;
        return data.filter(row =>
            JSON.stringify(row).toLowerCase().includes(search.toLowerCase())
        );
    }, [data, search]);

    const toggleAll = () => {
        if (selected.length === filteredData.length) setSelected([]);
        else setSelected(filteredData.map(row => row.id));
    };

    const toggleOne = (id: string) => {
        if (selected.includes(id)) setSelected(selected.filter(s => s !== id));
        else setSelected([...selected, id]);
    };

    if (data.length === 0) {
        return (
            <div className="p-8 border border-dashed border-zinc-800 rounded bg-zinc-950/20 text-center text-zinc-500 font-mono text-xs">
                NO_DATA_FOUND
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 px-2">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-zinc-400">
                        <Icon icon="lucide:search" width={14} />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="FILTER_REGISTRY..."
                        className="w-full bg-zinc-950 border border-zinc-900 focus:border-zinc-700 p-2.5 pl-10 text-[10px] font-mono text-zinc-300 outline-none transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute inset-y-0 right-3 flex items-center text-zinc-600 hover:text-white">
                            <Icon icon="lucide:x" width={14} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-600 border-l border-zinc-900 pl-4 h-[38px]">
                    <span className="flex items-center gap-1"><kbd className="bg-zinc-900 px-1 rounded border border-zinc-800 text-zinc-400">J/K</kbd> NAV</span>
                    <span className="flex items-center gap-1"><kbd className="bg-zinc-900 px-1 rounded border border-zinc-800 text-zinc-400">X</kbd> SELECT</span>
                </div>
            </div>

            {selected.length > 0 && (
                <div className="flex items-center gap-4 bg-zinc-900 border-y border-zinc-800 p-3 px-6 animate-in fade-in slide-in-from-top-2">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{selected.length} Selected_Objects</span>
                    <div className="flex gap-2 ml-auto">
                        <button className="text-[10px] font-black uppercase bg-white text-black px-4 py-1.5 hover:bg-rose-600 hover:text-white transition-all">Bulk_Action // TERMINATE</button>
                        <button className="text-[10px] font-black uppercase bg-zinc-800 text-white px-4 py-1.5 hover:bg-zinc-700 transition-all border border-zinc-700">Sync_Status</button>
                    </div>
                </div>
            )}

            <div className="border border-zinc-900 bg-zinc-950/20 overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-zinc-900/30 text-zinc-500 font-mono text-[9px] uppercase tracking-[0.2em] border-b border-zinc-900">
                        <tr>
                            <th className="p-4 w-8">
                                <input
                                    type="checkbox"
                                    checked={selected.length === filteredData.length && filteredData.length > 0}
                                    onChange={toggleAll}
                                    className="accent-white cursor-pointer"
                                />
                            </th>
                            {columns.map(col => (
                                <th key={col.key} className="p-4 font-black">{col.label}</th>
                            ))}
                            {actions && <th className="p-4 text-right">METRICS/OP</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/50">
                        {filteredData.map((row, i) => (
                            <tr key={row.id || i} className={`hover:bg-zinc-900/40 transition-colors group ${selected.includes(row.id) ? 'bg-zinc-900/60' : ''}`}>
                                <td className="p-4">
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(row.id)}
                                        onChange={() => toggleOne(row.id)}
                                        className="accent-white cursor-pointer"
                                    />
                                </td>
                                {columns.map(col => (
                                    <td key={col.key} className="p-4 text-zinc-400 group-hover:text-white transition-colors">
                                        {col.render ? col.render((row as any)[col.key], row) : (row as any)[col.key]}
                                    </td>
                                ))}
                                {actions && (
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                            {editUrl && (
                                                <Link
                                                    href={editUrl(row)}
                                                    className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
                                                    title="Modify Registry Entry"
                                                >
                                                    <Icon icon="lucide:terminal" width={14} />
                                                </Link>
                                            )}
                                            {onRestore && <RestoreButton id={row.id} action={onRestore} />}
                                            {onDelete && <DeleteButton id={row.id} action={onDelete} {...deleteProps} />}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredData.length === 0 && (
                    <div className="p-12 text-center text-zinc-600 italic font-mono text-xs">
                        FILTER_OVERRIDE: NO_MATCHES_IN_CURRENT_REGISTRY
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono uppercase text-zinc-600 border-t border-zinc-900 pt-2 px-1">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span>SYSTEM_READY // AWAITING_INPUT</span>
                </div>
                <div>
                    DISPLAYING {filteredData.length} OF {data.length} RECORDS
                </div>
            </div>
        </div>
    );
}
