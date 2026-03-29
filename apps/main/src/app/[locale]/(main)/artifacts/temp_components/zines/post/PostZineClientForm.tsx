"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';

export default function PostZineClientForm({ artifactId }: { artifactId: string }) {
    const router = useRouter();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // In a real app, logic to save would go here
        alert("Echo broadcasted into the void. (Mock functionality)");
        router.push(`/cinema/${artifactId}`);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-16">
            {/* THE PROMPT - MANDATORY CALL */}
            <div className="space-y-8">
                <div className="bg-rose-950/20 border-y border-rose-900/40 p-12 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
                    <Icon icon="lucide:message-square-quote" width={32} height={32} className="text-rose-600 mx-auto mb-6 opacity-30" />
                    <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white leading-tight">
                        &ldquo;What state in your life were you in when you experienced this?&rdquo;
                    </h3>
                    <div className="mt-6 flex items-center justify-center gap-4 text-rose-800 font-mono text-[10px] uppercase tracking-widest">
                        <Icon icon="lucide:shield-check" width={10} height={10} />
                        Required Field // Truth Verification Required
                    </div>
                </div>

                <div className="relative">
                    <textarea
                        required
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-black border-2 border-zinc-900 rounded-3xl p-10 md:p-14 text-xl md:text-2xl font-serif italic text-zinc-300 outline-none focus:border-rose-600 transition-all min-h-[400px] shadow-[inset_0_0_20px_rgba(0,0,0,1)] placeholder:text-zinc-900 leading-relaxed"
                        placeholder="Write your echo here... no formatting, just resonance."
                        disabled={isSubmitting}
                    />

                    {/* HUD SPECS in Textarea */}
                    <div className="absolute bottom-10 right-10 flex flex-col items-end gap-1 pointer-events-none opacity-20">
                        <span className="text-[11px] font-mono uppercase text-zinc-500">RES_CHAR_IDX: {content.length}</span>
                        <span className="text-[11px] font-mono uppercase text-rose-600">INPUT_READY</span>
                    </div>
                </div>
            </div>

            {/* Submission */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 pt-8">
                <div className="flex flex-col gap-2 max-w-sm">
                    <p className="text-[11px] font-mono text-zinc-600 uppercase italic leading-snug">
                        By broadcasting this zine, you archive this shard of your life in the collective memory floor. Shards cannot be edited after pulse.
                    </p>
                </div>

                <button
                    type="submit"
                    className="w-full md:w-auto bg-rose-600 text-black font-black italic text-3xl md:text-4xl px-20 py-8 shadow-[12px_12px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-tighter active:scale-95 disabled:bg-zinc-900 disabled:text-zinc-700 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
                    disabled={!content.trim() || isSubmitting}
                >
                    {isSubmitting ? 'BROADCASTING...' : 'PULSE_MEMOIR.'}
                </button>
            </div>
        </form>
    );
}

