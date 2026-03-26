
'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { createPlatform, updatePlatform } from '../../actions/platforms';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { MediaUploader, cn } from '@shimokitan/ui';
import { uploadMediaAction } from '../../media-actions';

import { externalPlatformSchema } from '@shimokitan/utils';
import { z } from 'zod';

type Platform = z.infer<typeof externalPlatformSchema>;

export default function PlatformForm({ 
    initialData, 
    onSuccess,
    insetMode
}: { 
    initialData?: Platform, 
    onSuccess?: () => void,
    insetMode?: boolean
}) {
    console.log('PlatformForm Mounted', { insetMode, hasInitialData: !!initialData });
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Platform>(initialData || {
        id: '',
        name: '',
        category: 'platform',
        iconUrl: '',
        accentColor: '#666666',
        isActive: true
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                id: '',
                name: '',
                category: 'platform',
                iconUrl: '',
                accentColor: '#666666',
                isActive: true
            });
        }
    }, [initialData]);

    const isEdit = !!initialData;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await updatePlatform(formData.id, formData);
                toast.success('Platform_Updated');
            } else {
                await createPlatform(formData);
                toast.success('Platform_Created');
            }
            if (onSuccess) onSuccess();
            router.refresh();
            // Reset if it was a new creation
            if (!isEdit) {
                setFormData({
                    id: '',
                    name: '',
                    category: 'platform',
                iconUrl: '',
                accentColor: '#666666',
                    isActive: true
                });
            }
        } catch (error: any) {
            toast.error(error.message || 'Transmission_Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form 
            onSubmit={handleSubmit} 
            className={cn(
                "space-y-4 p-6",
                !insetMode && "bg-zinc-950 border border-zinc-900 rounded-xl"
            )}
        >
            {!insetMode && (
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Icon icon={isEdit ? "lucide:edit-3" : "lucide:plus-circle"} className="text-rose-500" width={16} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white">
                            {isEdit ? 'Update_Signal_Protocol' : 'Initialize_New_Platform'}
                        </h3>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* ID - only for new */}
                <div className="space-y-1">
                    <label className="text-[8px] font-mono text-zinc-500 uppercase px-1">Identifier (Slug)</label>
                    <input
                        value={formData.id}
                        onChange={e => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                        disabled={isEdit}
                        placeholder="e.g. youtube"
                        className="w-full bg-black border border-zinc-900 px-3 py-2 text-[10px] text-zinc-300 outline-none focus:border-rose-900 transition-all rounded disabled:opacity-50"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[8px] font-mono text-zinc-500 uppercase px-1">Platform_Name</label>
                    <input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. YouTube"
                        className="w-full bg-black border border-zinc-900 px-3 py-2 text-[10px] text-zinc-300 outline-none focus:border-rose-900 transition-all rounded"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[8px] font-mono text-zinc-500 uppercase px-1">Sector_Category</label>
                    <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full bg-black border border-zinc-900 px-3 py-2 text-[10px] font-bold uppercase text-zinc-400 outline-none rounded focus:border-rose-900 appearance-none cursor-pointer"
                    >
                        <option value="platform">PLATFORM</option>
                        <option value="video">VIDEO / CHANNEL</option>
                        <option value="audio">AUDIO / STREAMING</option>
                        <option value="social">SOCIAL</option>
                        <option value="streaming">LIVE / BROADCAST</option>
                        <option value="commerce">COMMERCE</option>
                        <option value="archive">ARCHIVE</option>
                        <option value="portfolio">PORTFOLIO</option>
                        <option value="other">OTHER</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-[8px] font-mono text-zinc-500 uppercase px-1">Accent_Color</label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={formData.accentColor || '#666666'}
                            onChange={e => setFormData({ ...formData, accentColor: e.target.value })}
                            className="w-9 h-9 bg-black border border-zinc-900 rounded cursor-pointer p-1"
                        />
                        <input
                            value={formData.accentColor || ''}
                            onChange={e => setFormData({ ...formData, accentColor: e.target.value })}
                            placeholder="#666666"
                            className="flex-1 bg-black border border-zinc-900 px-3 py-2 text-[10px] font-mono text-zinc-300 outline-none focus:border-rose-900 transition-all rounded"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[8px] font-mono text-zinc-500 uppercase px-1">Platform_Icon_Protocol</label>
                <div className="flex items-center gap-4 p-3 bg-black border border-zinc-900 rounded-lg">
                    <MediaUploader
                        value={formData.iconUrl || ''}
                        uploadAction={uploadMediaAction}
                        onChange={(_, url) => setFormData({ ...formData, iconUrl: url })}
                        contextType="platform_icon"
                        contextId={formData.id}
                        label="Upload_Icon"
                        className="w-16 h-16 rounded-lg border-zinc-800"
                    />
                    <div className="flex-1 space-y-1">
                        <p className="text-[9px] text-zinc-500 font-mono leading-tight">
                            Recommended: SVGs or Transparent PNGs. 
                            <br />
                            Stored in the platform secondary vault.
                        </p>
                        <div className="flex items-center gap-2 text-[8px] font-mono text-zinc-600">
                            <Icon icon="lucide:link-2" width={10} />
                            <span className="truncate max-w-[150px]">{formData.iconUrl || 'No_Uplink_Established'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-900/50">
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all ${
                        formData.isActive 
                            ? 'bg-emerald-500/10 border-emerald-900/30 text-emerald-500' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                >
                    <Icon icon={formData.isActive ? "lucide:check-circle" : "lucide:circle"} width={14} />
                    <span className="text-[9px] font-black uppercase">Active_Status</span>
                </button>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-rose-600 hover:bg-rose-500 text-black px-6 py-2 rounded text-[10px] font-black uppercase italic tracking-widest disabled:opacity-50 transition-all flex items-center gap-2"
                >
                    {loading ? (
                        <Icon icon="lucide:loader-2" className="animate-spin" width={14} />
                    ) : (
                        <Icon icon="lucide:save" width={14} />
                    )}
                    {isEdit ? 'Uplink_Update' : 'Initialize_Registry'}
                </button>
            </div>
        </form>
    );
}
