
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { searchEntities, quickCreateEntity } from '../../actions';
import { toast } from 'sonner';
import { debounce } from 'lodash';

interface Entity {
    id: string;
    name: string;
    type: string;
    avatarUrl?: string | null;
}

interface EntitySearchPickerProps {
    label: string;
    type: 'independent' | 'organization' | 'agency' | 'circle' | 'staff' | 'all';
    value?: string; // entityId
    onSelect: (entity: Entity | null) => void;
    onOpenChange?: (isOpen: boolean) => void;
    placeholder?: string;
    entities?: Entity[]; // Optional pre-loaded entities to find names
}

export default function EntitySearchPicker({
    label,
    type,
    value,
    onSelect,
    onOpenChange,
    placeholder = "Search or create...",
    entities = []
}: EntitySearchPickerProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Entity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpenState] = useState(false);
    const [selectedName, setSelectedName] = useState('');

    /** Wrapper to sync open state with parent. */
    const setIsOpen = (open: boolean) => {
        setIsOpenState(open);
        onOpenChange?.(open);
    };

    // Sync selectedName if value changes and we have entities
    useEffect(() => {
        if (value) {
            const ent = entities.find(e => e.id === value);
            if (ent) {
                setSelectedName(ent.name);
            }
        } else {
            setSelectedName('');
        }
    }, [value, entities]);

    const fetchEntities = useCallback(
        debounce(async (q: string) => {
            if (!q.trim()) {
                setResults([]);
                return;
            }
            setIsLoading(true);
            try {
                const data = await searchEntities(q, type === 'all' ? undefined : type);
                setResults(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }, 300),
        [type]
    );

    useEffect(() => {
        if (isOpen) {
            fetchEntities(query);
        }
    }, [query, isOpen, fetchEntities]);

    const handleCreate = async () => {
        setIsLoading(true);
        try {
            const newEntity = await quickCreateEntity(query, type === 'all' ? 'independent' : type);
            toast.success(`Registered Profession Record: ${query}`);
            onSelect({ id: newEntity.id, name: query, type });
            setSelectedName(query);
            setIsOpen(false);
            setQuery('');
        } catch (error: any) {
            toast.error(error.message || 'System_Failure: Creation Failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-1 relative">
            <label className="text-[9px] font-mono uppercase text-zinc-600">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    value={isOpen ? query : selectedName || ''}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="w-full bg-black border border-zinc-800 p-2 text-xs text-white focus:border-violet-600 outline-none transition-colors"
                    placeholder={selectedName || placeholder}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isLoading && <Icon icon="lucide:loader-2" className="animate-spin text-zinc-600" width={12} />}
                    <Icon
                        icon={isOpen ? "lucide:chevron-up" : "lucide:chevron-down"}
                        className="text-zinc-600 cursor-pointer"
                        width={14}
                        onClick={() => setIsOpen(!isOpen)}
                    />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-black border border-zinc-800 shadow-2xl max-h-60 overflow-y-auto">
                    {results.length > 0 ? (
                        <div className="p-1">
                            {results.map((entity) => (
                                <button
                                    key={entity.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(entity);
                                        setSelectedName(entity.name);
                                        setIsOpen(false);
                                        setQuery('');
                                    }}
                                    className="w-full text-left p-2 hover:bg-zinc-900 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-sm bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0">
                                            {entity.avatarUrl ? (
                                                <img src={entity.avatarUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                                                    <Icon icon="lucide:user" width={14} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-zinc-300 group-hover:text-white">{entity.name}</span>
                                            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">{entity.type} // {entity.id}</span>
                                        </div>
                                    </div>
                                    <Icon icon="lucide:arrow-right" className="text-zinc-800 group-hover:text-violet-500 opacity-0 group-hover:opacity-100 transition-all" width={10} />
                                </button>
                            ))}
                        </div>
                    ) : (
                        !isLoading && query.trim() && (
                            <div className="p-2 text-center">
                                <p className="text-[9px] text-zinc-500 uppercase mb-2">No existing record for "{query}"</p>
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-[10px] font-bold uppercase text-violet-400 hover:bg-violet-950/20 hover:border-violet-800 transition-all"
                                >
                                    [ CREATE_PROFESSIONAL_RECORD ]
                                </button>
                            </div>
                        )
                    )}
                    {!query.trim() && results.length === 0 && !isLoading && (
                        <div className="p-1">
                            {entities.length > 0 ? (
                                <>
                                    <div className="px-2 py-1.5 text-[8px] font-mono text-zinc-600 uppercase tracking-widest border-b border-zinc-900 mb-1">Existing_Records</div>
                                    {entities.slice(0, 10).map((entity) => (
                                        <button
                                            key={entity.id}
                                            type="button"
                                            onClick={() => {
                                                onSelect(entity);
                                                setSelectedName(entity.name);
                                                setIsOpen(false);
                                                setQuery('');
                                            }}
                                            className="w-full text-left p-2 hover:bg-zinc-900 flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-sm bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0">
                                                    {entity.avatarUrl ? (
                                                        <img src={entity.avatarUrl} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700">
                                                            <Icon icon="lucide:user" width={14} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-zinc-300 group-hover:text-white">{entity.name}</span>
                                                    <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">{entity.type} // {entity.id}</span>
                                                </div>
                                            </div>
                                            <Icon icon="lucide:arrow-right" className="text-zinc-800 group-hover:text-violet-500 opacity-0 group-hover:opacity-100 transition-all" width={10} />
                                        </button>
                                    ))}
                                </>
                            ) : (
                                <div className="p-4 text-center text-[9px] text-zinc-700 uppercase">
                                    No records available. Begin typing to search...
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Backdrop to close on-click outside (simplistic) */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
