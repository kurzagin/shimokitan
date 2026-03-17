
"use client"

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { CREDIT_ROLES, CONTRIBUTOR_CLASSES } from '@shimokitan/utils';
import EntitySearchPicker from '../../artifacts/components/EntitySearchPicker';

interface Credit {
    entityId: string;
    entityName?: string;
    role: string;
    contributorClass: 'author' | 'collaborator' | 'staff';
    isPrimary: boolean;
    position: number;
}

interface WorkCreditsSectionProps {
    credits: Credit[];
    setCredits: (credits: Credit[]) => void;
}

export default function WorkCreditsSection({ credits, setCredits }: WorkCreditsSectionProps) {
    const addCredit = () => {
        setCredits([
            ...credits,
            {
                entityId: '',
                role: 'compose',
                contributorClass: 'author',
                isPrimary: false,
                position: credits.length
            }
        ]);
    };

    const updateCredit = (idx: number, field: keyof Credit, value: string | boolean | number | undefined) => {
        const newCredits = [...credits];
        newCredits[idx] = { ...newCredits[idx], [field]: value } as Credit;
        setCredits(newCredits);
    };

    const removeCredit = (idx: number) => {
        setCredits(credits.filter((_, i) => i !== idx));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-6">
                <div className="flex items-center gap-2">
                    <Icon icon="lucide:users" className="text-zinc-500" width={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">04 {'//'} CANON_CONTRIBUTORS</span>
                </div>
                <button
                    type="button"
                    onClick={addCredit}
                    className="text-[10px] uppercase font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                    <Icon icon="lucide:user-plus" width={12} /> Add_Contributor
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {credits.map((credit, i) => (
                    <div 
                        key={i} 
                        className="group flex flex-col gap-4 p-4 bg-zinc-950 border border-zinc-900 rounded-lg hover:border-violet-600/50 transition-all relative overflow-hidden"
                    >
                        {/* Status Strip */}
                        <div className="absolute top-0 left-0 w-1 h-full bg-violet-600 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 space-y-4">
                                {/* Entity Selection */}
                                <div className="space-y-1">
                                    <EntitySearchPicker
                                        label="Resident_Registry_Link"
                                        type="all"
                                        value={credit.entityId}
                                        onSelect={(ent) => {
                                            if (ent) {
                                                updateCredit(i, 'entityId', ent.id);
                                                updateCredit(i, 'entityName', ent.name);
                                            }
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Role Selection */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-mono uppercase text-zinc-500 tracking-tighter">Department_Role</label>
                                        <select
                                            value={credit.role}
                                            onChange={(e) => updateCredit(i, 'role', e.target.value)}
                                            className="w-full bg-black border border-zinc-800 p-2 text-[10px] font-bold text-white focus:border-violet-600 outline-none transition-all rounded"
                                        >
                                            {CREDIT_ROLES.map(r => (
                                                <option key={r.slug} value={r.slug}>{r.labels.en.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Class Selection */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-mono uppercase text-zinc-500 tracking-tighter">Class_Priority</label>
                                        <select
                                            value={credit.contributorClass}
                                            onChange={(e) => updateCredit(i, 'contributorClass', e.target.value as any)}
                                            className="w-full bg-black border border-zinc-800 p-2 text-[10px] font-bold text-white focus:border-violet-600 outline-none transition-all rounded"
                                        >
                                            {CONTRIBUTOR_CLASSES.map(c => (
                                                <option key={c} value={c}>{c.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => removeCredit(i)}
                                className="text-zinc-700 hover:text-rose-500 transition-colors p-1"
                            >
                                <Icon icon="lucide:trash-2" width={14} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 pt-2 border-t border-zinc-900/50">
                            <label className="flex items-center gap-2 cursor-pointer group/chk">
                                <input
                                    type="checkbox"
                                    checked={credit.isPrimary}
                                    onChange={(e) => updateCredit(i, 'isPrimary', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-3 h-3 border border-zinc-800 rounded-sm bg-black peer-checked:bg-violet-600 peer-checked:border-violet-600 transition-all flex items-center justify-center">
                                    <Icon icon="lucide:check" width={8} className="text-black opacity-0 peer-checked:opacity-100" />
                                </div>
                                <span className="text-[9px] font-black uppercase text-zinc-500 group-hover/chk:text-zinc-300 transition-colors">Primary_Authority</span>
                            </label>

                            <div className="flex-1"></div>
                            
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-zinc-600 uppercase">Pos</span>
                                <input
                                    type="number"
                                    value={credit.position}
                                    onChange={(e) => updateCredit(i, 'position', parseInt(e.target.value) || 0)}
                                    className="w-10 bg-black border border-zinc-800 p-1 text-[9px] font-mono text-center text-zinc-400 focus:border-zinc-700 outline-none rounded"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {credits.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 bg-zinc-950/20 border border-dashed border-zinc-900 rounded-xl opacity-50">
                    <Icon icon="lucide:users" width={24} className="text-zinc-700 mb-2" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600">No_Canon_Contributors_Defined</span>
                </div>
            )}
        </div>
    );
}
