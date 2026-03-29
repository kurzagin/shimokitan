
"use client"

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { broadcastZineAction } from '@/app/[locale]/(main)/zines/actions';
import { cn } from '@shimokitan/ui';
import { authClient } from '@shimokitan/auth';

interface ZineCreateFormProps {
    artifactId: string;
    exhibitId?: string;
    onSuccess?: () => void;
}

export default function ZineCreateForm({ artifactId, exhibitId, onSuccess }: ZineCreateFormProps) {
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic Lore labels based on role (Mocking roles until DB sync is confirmed on client session)
    // In SHIMOKITAN, roles are: resident, architect, founder
    const getRoleLabel = () => {
        const role = (user as any)?.role || 'resident';
        switch (role) {
            case 'founder': return 'Overseer_Signal';
            case 'architect': return 'Architect_Certified';
            default: return 'Resident_Verified';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const result = await broadcastZineAction({
                artifactId,
                exhibitId,
                content: content.trim()
            });

            if (result.success) {
                toast.success("Echo broadcasted into the collective memory.");
                setContent('');
                if (onSuccess) onSuccess();
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Broadcast interrupted. Signal lost.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* THE PROMPT - WARMER & COMPACT */}
            <div className="bg-amber-900/5 border border-amber-900/20 p-6 md:p-8 text-center relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
                <Icon icon="lucide:quote" width={20} height={20} className="text-amber-700 mx-auto mb-3 opacity-40" />
                <h3 className="text-lg md:text-xl font-black italic uppercase tracking-tighter text-amber-50 leading-tight">
                    &ldquo;What state in your life were you in when you experienced this?&rdquo;
                </h3>
            </div>

            <div className="flex flex-col gap-4">
                <div className="relative group">
                    <textarea
                        required
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className={cn(
                            "w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8",
                            "text-base md:text-lg font-serif italic text-amber-50/90 outline-none",
                            "focus:border-rose-700 focus:ring-1 focus:ring-rose-700/30 transition-all",
                            "min-h-[180px] md:min-h-[240px] leading-relaxed custom-scroll",
                            "placeholder:text-zinc-800"
                        )}
                        placeholder="Speak into the void... records are permanent shards of self."
                        disabled={isSubmitting}
                    />

                    {/* HUD SPECS - SUBTLE */}
                    <div className="absolute bottom-4 right-6 flex items-center gap-3 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                        <span className="text-[9px] font-mono uppercase text-zinc-600 tracking-widest">{content.length} CHARS</span>
                        <div className="w-1 h-1 rounded-full bg-rose-600 animate-pulse" />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                            {user?.image ? (
                                <img src={user.image} alt={user.name || ''} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <Icon icon="lucide:user" className="text-zinc-700" width={14} />
                            )}
                        </div>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                            Identity // <span className="text-zinc-400">{user?.name || 'Resident_Unknown'}</span>
                            <span className="mx-2 text-zinc-800">·</span>
                            <span className="text-rose-600/60 font-black italic">{getRoleLabel()}</span>
                            {((user as any)?.resonanceMultiplier || 0) > 0 && (
                                <>
                                    <span className="mx-2 text-zinc-800">·</span>
                                    <span className="text-amber-600/60">{(user as any).resonanceMultiplier}w</span>
                                </>
                            )}
                        </p>
                    </div>

                    <button
                        type="submit"
                        className={cn(
                            "w-full md:w-auto bg-amber-50 text-black font-black italic text-lg md:text-xl px-10 py-4",
                            "hover:bg-rose-600 hover:text-white transition-all uppercase tracking-tighter",
                            "active:scale-95 disabled:bg-zinc-900 disabled:text-zinc-700 cursor-pointer disabled:cursor-not-allowed",
                            "rounded-full shadow-lg shadow-black/50"
                        )}
                        disabled={!content.trim() || isSubmitting}
                    >
                        {isSubmitting ? 'BROADCASTING...' : 'PULSE_MEMOIR.'}
                    </button>
                </div>
            </div>

            <div className="pt-2 text-center md:text-left">
                <p className="text-[9px] font-mono text-zinc-700 uppercase italic tracking-widest">
                    ARCHIVE_PROTOCOL_ENABLED // SHARDS_ARE_IMMUTABLE_AFTER_BROADCAST
                </p>
            </div>
        </form>
    );
}
