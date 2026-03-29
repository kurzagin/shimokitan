"use client"

import { Icon } from '@iconify/react';
import Link from 'next/link';
import { authClient } from '@shimokitan/auth';
import { toast } from 'sonner';
import { useState, FormEvent } from 'react';

export default function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
    const [isPending, setIsPending] = useState(false);
    const [isSent, setIsSent] = useState(false);

    async function handleRequest(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsPending(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;

        try {
            const { error } = await authClient.requestPasswordReset({
                email,
                redirectTo: '/auth/reset-password',
            });

            if (error) {
                toast.error(`Recovery_Failure: ${error.message || 'Signal_Corrupted'}`);
            } else {
                toast.success('Recovery_Protocol_Initiated: Check your transmission.');
                setIsSent(true);
            }
        } catch (err: any) {
            const errorMessage = err.body?.message || err.message || 'Signal_Corrupted';
            toast.error(`System_Error: ${errorMessage}`);
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="min-h-screen bg-black text-violet-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-violet-600/50">
            {/* RAW TEXTURE OVERLAYS */}
            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat z-50" />

            {/* VIOLET SPRAY */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-950/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-2xl relative z-10 py-12">
                {/* VERTICAL ACCENT */}
                <div className="absolute -left-8 top-0 h-32 w-[1px] bg-violet-600/50" />

                <header className="mb-16 relative">
                    <div className="flex items-baseline gap-4">
                        <span className="text-3xl sm:text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-white py-1">
                            RECOVERY
                        </span>
                        <div className="flex-1 h-1 bg-violet-600/40" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-tight text-violet-600 md:ml-20">
                        PROTOCOL.
                    </h2>
                </header>

                {!isSent ? (
                    <form className="max-w-xl space-y-12" onSubmit={handleRequest}>
                        <div className="relative group">
                            <div className="absolute -left-10 top-2 text-violet-600/50">
                                <Icon icon="lucide:mail" width={20} height={20} className="group-focus-within:translate-x-2 transition-transform" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-baseline justify-between">
                                    <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Email Address</label>
                                    <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest hidden sm:block">Signal_Target</span>
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="bg-transparent border-b border-zinc-800 focus:border-violet-600 text-xl py-2 font-medium outline-none text-white placeholder:text-zinc-700 transition-colors w-full"
                                    placeholder="user@example.com"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="pt-8 flex flex-col md:flex-row items-start md:items-center gap-8">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="relative px-12 py-4 bg-white text-black font-black italic text-xl uppercase tracking-tighter hover:bg-violet-600 hover:text-white transition-all shadow-[6px_6px_0px_#2e1065] hover:shadow-none translate-y-[0px] hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? 'BROADCASTING...' : 'INITIATE.'}
                            </button>

                            <div className="flex flex-col gap-2">
                                <Link href="/auth/signin" className="text-zinc-500 text-[10px] font-black italic uppercase hover:text-white transition-colors border-b border-zinc-900 pb-0.5">
                                    [ ABORT? // RETURN_TO_BASE ]
                                </Link>
                                <span className="text-[7px] font-mono text-zinc-700 uppercase tracking-widest italic">Sector_TYO_Dist_00</span>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="max-w-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 border border-zinc-900 bg-zinc-900/10 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-violet-600/20" />
                            <Icon icon="lucide:radio-receiver" width={48} className="text-violet-600 mb-6" />
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-4">TRANSMISSION_SENT.</h3>
                            <p className="text-sm text-zinc-400 leading-relaxed font-mono uppercase tracking-tight">
                                We have dispatched a recovery Signal to your registered endpoint. Follow the link within to establish a new access code.
                            </p>
                            <div className="mt-8">
                                <Link href="/auth/signin" className="px-8 py-3 bg-zinc-900 text-white font-black italic text-xs uppercase tracking-widest hover:bg-violet-600 transition-all inline-block border border-zinc-800">
                                    Acknowledge.
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MINIMAL FOOTER BAR */}
            <aside className="fixed bottom-0 left-0 w-full border-t border-zinc-800/30 bg-zinc-950/20 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between px-6 py-4 text-[10px] shrink-0 z-50 gap-4 text-zinc-500">
                <div className="font-mono tracking-[0.3em] text-[8px] md:text-[10px] uppercase font-bold opacity-40">
                    © 2026 SHIMOKITAN
                </div>
            </aside>
        </div>
    );
}
