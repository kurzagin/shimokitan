"use client"
 
import React from 'react';
import { Icon } from '@iconify/react';
import EntitySearchPicker from './EntitySearchPicker';
import { CREDIT_ROLES } from '@shimokitan/utils';
 
interface Entity {
    id: string;
    name: string;
    type: string;
}
 
interface Credit {
    entityId: string;
    role: string;
    displayRole?: string;
    contributorClass: 'author' | 'collaborator' | 'staff';
    isPrimary: boolean;
    isOriginalArtist: boolean;
    position: number;
}
 
interface CreditsSectionProps {
    locale: 'en' | 'id' | 'ja';
    entities: Entity[];
    credits: Credit[];
    updateCredit: (idx: number, field: keyof Credit, value: any) => void;
    addCredit: () => void;
    removeCredit: (idx: number) => void;
}
 
export default function CreditsSection({
    locale,
    entities,
    credits,
    updateCredit,
    addCredit,
    removeCredit
}: CreditsSectionProps) {
    const uiLocale = locale === 'id' ? 'en' : locale;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-6">
                <div className="flex items-center gap-2">
                    <Icon icon="lucide:users" className="text-zinc-500" width={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 font-mono">05 // CONTRIBUTION_LEDGER</span>
                </div>
                <button
                    type="button"
                    onClick={addCredit}
                    className="text-[9px] uppercase font-black text-zinc-500 hover:text-rose-500 flex items-center gap-2 transition-all px-3 py-1 bg-zinc-950 border border-zinc-900 rounded-md"
                >
                    <Icon icon="lucide:plus" width={10} /> ADD_CONTRIBUTOR
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {credits.map((credit, i) => {
                    const isHeritage = credit.isOriginalArtist;
                    return (
                        <div 
                            key={i} 
                            className={`flex flex-col gap-3 p-4 relative overflow-hidden transition-all ${
                                isHeritage 
                                    ? 'bg-violet-950/20 border-l-2 border-violet-600 ring-1 ring-violet-900/10' 
                                    : 'bg-zinc-950 border-l-2 border-zinc-900'
                            }`}
                        >
                            <div className="flex gap-3 items-start relative z-10">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 ${
                                            isHeritage ? 'bg-violet-900/40 text-violet-300' : 'bg-zinc-900 text-zinc-500'
                                        }`}>
                                            {isHeritage ? 'Heritage_Node' : 'Station_Node'}
                                        </span>
                                        {credit.isPrimary && (
                                            <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-amber-600/20 text-amber-400">
                                                Primary
                                            </span>
                                        )}
                                    </div>
                                    <EntitySearchPicker
                                        label=""
                                        type="all"
                                        value={credit.entityId}
                                        onSelect={(entity) => {
                                            updateCredit(i, 'entityId', entity?.id || '');
                                        }}
                                        placeholder="Search residency..."
                                        entities={entities}
                                    />
                                </div>
                                <div className="flex items-center gap-1 shrink-0 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => updateCredit(i, 'isPrimary', !credit.isPrimary)}
                                        className={`p-2 transition-all ${credit.isPrimary ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-700 hover:text-zinc-500'}`}
                                        title="Set as Primary"
                                    >
                                        <Icon icon={credit.isPrimary ? "lucide:star" : "lucide:star-off"} width={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newState = !credit.isOriginalArtist;
                                            updateCredit(i, 'isOriginalArtist', newState);
                                            if (newState && !credit.role) {
                                                updateCredit(i, 'role', 'original');
                                            }
                                        }}
                                        className={`p-2 transition-all ${isHeritage ? 'text-violet-400 bg-violet-600/20' : 'text-zinc-700 hover:text-violet-500'}`}
                                        title="Mark as Heritage (Original IP Artist)"
                                    >
                                        <Icon icon="lucide:copyright" width={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeCredit(i)}
                                        className="p-2 text-zinc-700 hover:text-rose-500 transition-all"
                                    >
                                        <Icon icon="lucide:trash-2" width={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 relative z-10">
                                 <select
                                     value={credit.role}
                                     onChange={(e) => updateCredit(i, 'role', e.target.value)}
                                     className={`bg-black border p-3 text-[10px] font-mono font-black uppercase outline-none focus:border-violet-500/50 appearance-none cursor-pointer ${
                                         isHeritage ? 'border-violet-900/30 text-violet-300' : 'border-zinc-900 text-zinc-400'
                                     }`}
                                 >
                                     <option value="" disabled>{isHeritage ? 'Source_Nature (REQUIRED)...' : 'Select Department (REQUIRED)...'}</option>
                                    {CREDIT_ROLES.map((r) => (
                                        <option key={r.slug} value={r.slug} className="bg-zinc-950">
                                            {r.labels[uiLocale as 'en' | 'ja'] || r.labels.en}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    value={credit.displayRole || ''}
                                    onChange={(e) => updateCredit(i, 'displayRole', e.target.value)}
                                    placeholder={uiLocale === 'ja' ? '表示ラベル (例: メインボーカル)' : "Display Label (e.g. Lead Vocals)"}
                                    className="bg-black border border-zinc-900 p-3 text-[10px] font-mono text-zinc-500 outline-none focus:border-violet-500/50"
                                />
                            </div>

                             {!isHeritage && (
                                <div className="flex gap-2 relative z-10">
                                    <select
                                        value={credit.contributorClass}
                                        onChange={(e) => updateCredit(i, 'contributorClass', e.target.value)}
                                        className="bg-zinc-900/50 border border-zinc-800 p-2 text-[10px] font-mono text-zinc-600 outline-none flex-1"
                                    >
                                        <option value="author">Class: Author (Manifestation)</option>
                                        <option value="collaborator">Class: Collaborator</option>
                                        <option value="staff">Class: Staff</option>
                                    </select>
                                    <input
                                        type="number"
                                        value={credit.position}
                                        onChange={(e) => updateCredit(e.target.value === '' ? i : i, 'position', parseInt(e.target.value) || 0)}
                                        placeholder="Pos"
                                        className="bg-zinc-900/50 border border-zinc-800 p-2 text-[10px] font-mono text-zinc-600 w-16 outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
