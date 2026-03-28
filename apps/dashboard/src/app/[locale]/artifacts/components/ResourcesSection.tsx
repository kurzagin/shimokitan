
"use client"

import React from 'react';
import { Icon } from '@iconify/react';

import { RESOURCE_ROLES, PLATFORM_REGISTRY, detectPlatformFromUrl } from '@shimokitan/utils';

export interface Resource {
    type: string;
    platform: string;
    url: string;
    role: typeof RESOURCE_ROLES[number];
    isPrimary: boolean;
}

export interface Platform {
    id: string;
    name: string;
    category: string;
}

interface ResourcesSectionProps {
    resources: Resource[];
    setResources: (resources: Resource[]) => void;
    updateResource: (idx: number, field: keyof Resource, value: any) => void;
    addResource: (role?: typeof RESOURCE_ROLES[number], type?: string) => void;
    removeResource: (idx: number) => void;
    platforms?: Platform[]; // Optional dynamic platforms from DB
}

export default function ResourcesSection({
    resources,
    setResources,
    updateResource,
    addResource,
    removeResource,
    platforms = []
}: ResourcesSectionProps) {

    const activePlatforms = platforms.length > 0 ? platforms : PLATFORM_REGISTRY;

    const getFilteredPlatforms = (type: string) => {
        return activePlatforms.filter(p => p.category === type || type === 'other');
    };

    const playableRoles = ['audio', 'video', 'hosted_audio'];
    const linkRoles = ['social', 'commerce', 'reference', 'download'];

    const playableResources = resources.filter(r => playableRoles.includes(r.role));
    const linkResources = resources.filter(r => linkRoles.includes(r.role));

    const renderResource = (res: Resource, originalIdx: number) => (
        <div key={originalIdx} className="group relative flex flex-col md:flex-row gap-3 items-center bg-zinc-950/40 p-3 rounded-lg border border-zinc-900 transition-all hover:bg-zinc-950 hover:border-zinc-800">
            {/* Selector Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 w-full md:w-auto">
                {/* 
                  * 1. GATEWAY (Platform) - This is now the primary driver.
                  * Selecting a platform automatically suggests the correct Sector and Protocol.
                  */}
                <div className="space-y-1">
                    <span className="text-[7px] font-mono text-zinc-600 uppercase pl-1">Gateway_Node</span>
                    <select
                        value={res.platform}
                        onChange={(e) => {
                            const platformId = e.target.value;
                            const platformMeta = PLATFORM_REGISTRY.find(p => p.id === platformId);
                            
                            if (platformMeta) {
                                const newResources = [...resources];
                                newResources[originalIdx] = { 
                                    ...newResources[originalIdx], 
                                    platform: platformId,
                                    type: platformMeta.category,
                                    role: (platformMeta as any).defaultRole || 'reference'
                                };
                                setResources(newResources);
                            } else {
                                updateResource(originalIdx, 'platform', platformId);
                            }
                        }}
                        className="w-full bg-black border border-zinc-900 p-2 text-[10px] font-bold uppercase text-zinc-300 outline-none rounded focus:border-rose-900 appearance-none cursor-pointer"
                    >
                        {activePlatforms.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* 
                  * 2. SECTOR (Category) - Derived from Platform, but overrideable for custom links.
                  */}
                <div className="space-y-1">
                    <span className="text-[7px] font-mono text-zinc-600 uppercase pl-1">Sector_Domain</span>
                    <select
                        value={res.type}
                        onChange={(e) => {
                            const newType = e.target.value;
                            const platformMeta = PLATFORM_REGISTRY.find(p => p.category === newType);
                            
                            const newResources = [...resources];
                            newResources[originalIdx] = { 
                                ...newResources[originalIdx], 
                                type: newType, 
                                platform: platformMeta?.id || 'other',
                                role: (platformMeta as any)?.defaultRole || 'reference'
                            };
                            setResources(newResources);
                        }}
                        className="w-full bg-black border border-zinc-900 p-2 text-[10px] font-bold uppercase text-zinc-500 outline-none rounded focus:border-rose-900 appearance-none cursor-pointer"
                    >
                        <option value="video">VIDEO</option>
                        <option value="audio">AUDIO</option>
                        <option value="social">SOCIAL</option>
                        <option value="commerce">COMMERCE</option>
                        <option value="other">OTHER</option>
                    </select>
                </div>

                {/* 
                  * 3. PROTOCOL (Role) - The functional identity of the link.
                  */}
                <div className="space-y-1">
                    <span className="text-[7px] font-mono text-zinc-600 uppercase pl-1">Protocol_Role</span>
                    <select
                        value={res.role}
                        onChange={(e) => updateResource(originalIdx, 'role', e.target.value)}
                        className="w-full bg-black border border-zinc-900 p-2 text-[10px] font-bold uppercase text-rose-500/80 outline-none rounded focus:border-rose-900 appearance-none cursor-pointer"
                    >
                        {playableRoles.includes(res.role) || res.type === 'video' || res.type === 'audio' ? (
                            <>
                                <option value="video">VIDEO_MANIFEST</option>
                                <option value="audio">AUDIO_STREAM</option>
                                <option value="hosted_audio">INTERNAL_VAULT</option>
                            </>
                        ) : null}
                        {linkRoles.includes(res.role) || res.type === 'social' || res.type === 'commerce' || res.type === 'other' ? (
                            <>
                                <option value="social">SOCIAL_UPLINK</option>
                                <option value="commerce">COMMERCE_LINK</option>
                                <option value="reference">REFERENCE_SRC</option>
                                <option value="download">DIRECT_FETCH</option>
                            </>
                        ) : null}
                    </select>
                </div>
            </div>

            {/* URL Uplink */}
            <div className="flex-1 w-full space-y-1">
                <span className="text-[7px] font-mono text-zinc-600 uppercase pl-1">Network_Uplink_Address</span>
                <div className="relative">
                    <input
                        value={res.url}
                        onChange={(e) => updateResource(originalIdx, 'url', e.target.value)}
                        placeholder="https://source.network/uplink/..."
                        className="w-full bg-black border border-zinc-800 p-2.5 text-[11px] text-zinc-300 outline-none focus:border-rose-900 italic transition-all rounded"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => updateResource(originalIdx, 'isPrimary', !res.isPrimary)}
                            className={`p-1.5 transition-all rounded ${res.isPrimary ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-600 hover:text-white'}`}
                            title="Assign Primary Gateway"
                        >
                            <Icon icon={res.isPrimary ? "lucide:star-full" : "lucide:star"} width={10} />
                        </button>
                        <button
                            type="button"
                            onClick={() => removeResource(originalIdx)}
                            className="p-1.5 text-zinc-600 hover:text-rose-500 transition-all"
                            title="Terminate Link"
                        >
                            <Icon icon="lucide:trash-2" width={10} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-6">
                <div className="flex items-center gap-2">
                    <Icon icon="lucide:globe" className="text-zinc-500" width={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 font-mono">03 // NETWORK_GATEWAYS</span>
                </div>
                <button
                    type="button"
                    onClick={() => addResource()}
                    className="text-[9px] uppercase font-black text-zinc-500 hover:text-rose-500 flex items-center gap-2 transition-all px-3 py-1 bg-zinc-950 border border-zinc-900 rounded-md hover:border-rose-900/50"
                >
                    <Icon icon="lucide:plus" width={10} /> INITIALIZE_UPLINK
                </button>
            </div>

            <div className="space-y-6">
                {/* 1. Playable Manifestations */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-3 bg-rose-600"></div>
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest font-mono">Manifestations_Stream</span>
                        <span className="text-[7px] text-zinc-600 uppercase font-mono">(Direct Playable Sources)</span>
                    </div>
                    {playableResources.length > 0 ? (
                        playableResources.map(res => renderResource(res, resources.indexOf(res)))
                    ) : (
                        <div className="p-4 border border-dashed border-zinc-900 rounded-lg text-[9px] text-zinc-700 uppercase font-mono text-center">
                            No playable manifestations detected.
                        </div>
                    )}
                </div>

                {/* 2. External Junctions */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-3 bg-zinc-600"></div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest font-mono">Outbound_Uplinks</span>
                        <span className="text-[7px] text-zinc-600 uppercase font-mono">(Social / Commerce / References)</span>
                        <button
                            type="button"
                            onClick={() => addResource('social', 'social')}
                            className="ml-auto text-[8px] uppercase font-bold text-zinc-600 hover:text-white transition-all flex items-center gap-1.5"
                        >
                            <Icon icon="lucide:plus" width={8} /> ADD_JUNCTION
                        </button>
                    </div>
                    {linkResources.length > 0 ? (
                        linkResources.map(res => renderResource(res, resources.indexOf(res)))
                    ) : (
                        <div className="p-4 border border-dashed border-zinc-900 rounded-lg text-[9px] text-zinc-700 uppercase font-mono text-center">
                            No external junctions established.
                        </div>
                    )}
                </div>

                {resources.length === 0 && (
                    <div className="py-12 border border-dashed border-zinc-900 rounded-lg flex flex-col items-center justify-center gap-3 bg-zinc-950/20">
                        <Icon icon="lucide:unplug" className="text-zinc-800" width={24} />
                        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">No active network uplinks detected.</p>
                        <button
                            type="button"
                            onClick={() => addResource('social', 'social')}
                            className="text-[9px] font-black uppercase text-rose-600 hover:text-white transition-all underline decoration-rose-900 underline-offset-4"
                        >
                            Establish_Connection
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
