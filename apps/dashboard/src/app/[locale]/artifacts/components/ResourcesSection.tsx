
"use client"

import React from 'react';
import { Icon } from '@iconify/react';

import { RESOURCE_ROLES } from '@shimokitan/utils';

export interface Resource {
    type: string;
    platform: string;
    url: string;
    role: 'stream' | 'embed_video' | 'hosted_audio' | 'download' | 'social' | 'reference';
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
    addResource: () => void;
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

    // Minimal fallback platforms if none provided via props
    const fallbackPlatforms: Platform[] = [
        { id: 'youtube', name: 'YouTube', category: 'platform' },
        { id: 'spotify', name: 'Spotify', category: 'platform' },
        { id: 'x', name: 'X', category: 'social' },
        { id: 'r2', name: 'Internal Storage', category: 'other' },
    ];

    const activePlatforms = platforms.length > 0 ? platforms : fallbackPlatforms;

    const getFilteredPlatforms = (type: string) => {
        if (type === 'mv') return activePlatforms.filter(p => ['youtube', 'bilibili', 'niconico'].includes(p.id));
        if (type === 'stream') return activePlatforms.filter(p => ['stream', 'platform'].includes(p.category) || ['spotify', 'soundcloud', 'apple_music'].includes(p.id));
        if (type === 'social') return activePlatforms.filter(p => p.category === 'social');
        return activePlatforms;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-6">
                <div className="flex items-center gap-2">
                    <Icon icon="lucide:globe" className="text-zinc-500" width={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 font-mono">03 // NETWORK_GATEWAYS</span>
                </div>
                <button
                    type="button"
                    onClick={addResource}
                    className="text-[9px] uppercase font-black text-zinc-500 hover:text-rose-500 flex items-center gap-2 transition-all px-3 py-1 bg-zinc-950 border border-zinc-900 rounded-md hover:border-rose-900/50"
                >
                    <Icon icon="lucide:plus" width={10} /> INITIALIZE_UPLINK
                </button>
            </div>

            <div className="space-y-3">
                {resources.map((res, i) => (
                    <div key={i} className="group relative flex flex-col md:flex-row gap-3 items-center bg-zinc-950/40 p-3 rounded-lg border border-zinc-900 transition-all hover:bg-zinc-950 hover:border-zinc-800">
                        {/* Selector Group */}
                        <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
                            <div className="space-y-1">
                                <span className="text-[7px] font-mono text-zinc-600 uppercase pl-1">Sector</span>
                                <select
                                    value={res.type}
                                    onChange={(e) => {
                                        const newType = e.target.value;
                                        let defaultPlatform = 'other';
                                        if (newType === 'mv') defaultPlatform = 'youtube';
                                        if (newType === 'stream') defaultPlatform = 'spotify';
                                        if (newType === 'social') defaultPlatform = 'x';
                                        const newResources = [...resources];
                                        newResources[i] = { ...newResources[i], type: newType, platform: defaultPlatform };
                                        setResources(newResources);
                                    }}
                                    className="w-full bg-black border border-zinc-900 p-2 text-[10px] font-bold uppercase text-zinc-400 outline-none rounded focus:border-rose-900 appearance-none cursor-pointer"
                                >
                                    <option value="mv">VIDEO</option>
                                    <option value="stream">STREAM</option>
                                    <option value="social">SOCIAL</option>
                                    <option value="gallery">GALLERY</option>
                                    <option value="store">STORE</option>
                                    <option value="other">OTHER</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[7px] font-mono text-zinc-600 uppercase pl-1">Protocol</span>
                                <select
                                    value={res.role}
                                    onChange={(e) => updateResource(i, 'role', e.target.value)}
                                    className="w-full bg-black border border-zinc-900 p-2 text-[10px] font-bold uppercase text-rose-500/80 outline-none rounded focus:border-rose-900 appearance-none cursor-pointer"
                                >
                                    <option value="stream">STREAM</option>
                                    <option value="embed_video">EMBED</option>
                                    <option value="hosted_audio">HOSTED</option>
                                    <option value="download">DOWN</option>
                                    <option value="social">SOC</option>
                                    <option value="reference">REF</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[7px] font-mono text-zinc-600 uppercase pl-1">Gateway</span>
                                <select
                                    value={res.platform}
                                    onChange={(e) => updateResource(i, 'platform', e.target.value)}
                                    className="w-full bg-black border border-zinc-900 p-2 text-[10px] font-bold uppercase text-zinc-400 outline-none rounded focus:border-rose-900 appearance-none cursor-pointer"
                                >
                                    {getFilteredPlatforms(res.type).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                    <option value="r2">R2_STORAGE</option>
                                    <option value="other">OTHER</option>
                                </select>
                            </div>
                        </div>

                        {/* URL Uplink */}
                        <div className="flex-1 w-full space-y-1">
                            <span className="text-[7px] font-mono text-zinc-600 uppercase pl-1">Network_Uplink_Address</span>
                            <div className="relative">
                                <input
                                    value={res.url}
                                    onChange={(e) => updateResource(i, 'url', e.target.value)}
                                    placeholder="https://source.network/uplink/..."
                                    className="w-full bg-black border border-zinc-800 p-2.5 text-[11px] text-zinc-300 outline-none focus:border-rose-900 italic transition-all rounded"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => updateResource(i, 'isPrimary', !res.isPrimary)}
                                        className={`p-1.5 transition-all rounded ${res.isPrimary ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-600 hover:text-white'}`}
                                        title="Assign Primary Gateway"
                                    >
                                        <Icon icon={res.isPrimary ? "lucide:star" : "lucide:star"} width={10} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeResource(i)}
                                        className="p-1.5 text-zinc-600 hover:text-rose-500 transition-all"
                                        title="Terminate Link"
                                    >
                                        <Icon icon="lucide:trash-2" width={10} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {resources.length === 0 && (
                    <div className="py-12 border border-dashed border-zinc-900 rounded-lg flex flex-col items-center justify-center gap-3 bg-zinc-950/20">
                        <Icon icon="lucide:unplug" className="text-zinc-800" width={24} />
                        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">No active network uplinks detected.</p>
                        <button
                            type="button"
                            onClick={addResource}
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
