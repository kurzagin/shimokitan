'use client';

import React, { useTransition } from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@shimokitan/ui';
import Link from '@/components/Link';
import { toggleArtifactReaction } from '../actions';
import { toast } from 'sonner';

type ShardType = "core" | "flux" | "void" | "glitch" | "spark" | "pulse";

interface ShardDef {
    type: ShardType;
    icon: string;
    label: string;
    color: string;
}

const SHARDS: ShardDef[] = [
    { type: 'core', icon: 'lucide:heart', label: 'LIKE', color: 'text-rose-500' },
    { type: 'flux', icon: 'lucide:waves', label: 'FLUX', color: 'text-violet-500' },
    { type: 'spark', icon: 'lucide:zap', label: 'SPARK', color: 'text-emerald-500' },
];

interface PulseShardsProps {
    artifactId: string;
    userReactions: ShardType[];
    counts: Record<ShardType, number>;
}

export function CompactPulse({ artifactId, userReactions, counts, zineCount }: PulseShardsProps & { zineCount?: number }) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = (type: ShardType) => {
        if (isPending) return;
        startTransition(async () => {
            try {
                const res = await toggleArtifactReaction({ artifactId, type });
                if (res.action === 'added') {
                    toast.success(`SIGNAL_SYCHRONIZED: ${type.toUpperCase()}`);
                }
            } catch (e: any) {
                toast.error('[SYNC_FAILED]');
            }
        });
    };

    return (
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/30 rounded-lg">
            {SHARDS.map((shard) => {
                const isActive = userReactions.includes(shard.type);
                const count = counts[shard.type] || 0;

                return (
                    <button
                        key={shard.type}
                        onClick={() => handleToggle(shard.type)}
                        disabled={isPending}
                        title={`${shard.label}: ${count} pulses`}
                        className={cn(
                            "flex items-center gap-2 px-2.5 py-2 transition-all rounded-md relative group/shard overflow-hidden",
                            isActive ? "bg-zinc-800 text-white shadow-lg shadow-black/20" : "bg-black/40 text-zinc-500 hover:text-zinc-300 hover:bg-black/60"
                        )}
                    >
                        {/* Shimmer background on active */}
                        {isActive && (
                            <div className={cn("absolute inset-0 opacity-15 animate-pulse", shard.color.replace('text', 'bg'))} />
                        )}
                        
                        <Icon 
                            icon={shard.icon} 
                            className={cn(
                                "w-3.5 h-3.5 transition-all duration-300",
                                shard.color,
                                isActive ? "opacity-100 scale-110 drop-shadow-[0_0_8px_currentColor]" : "opacity-60 group-hover/shard:opacity-100"
                            )} 
                        />
                        {count > 0 && (
                            <span className={cn(
                                "text-[10px] font-black font-mono leading-none tracking-tighter transition-opacity duration-300",
                                isActive ? "opacity-100" : "opacity-70"
                            )}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
            
            <div className="w-[1px] h-5 bg-zinc-800 mx-0.5" />

            <Link 
                href={`/cinema/${artifactId}/zines/post`}
                className="flex items-center gap-2.5 px-3 py-2 bg-rose-500/5 border border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/10 group/zine transition-all rounded-md"
                title="Post Echo Shard"
            >
                <Icon icon="lucide:message-square-plus" className="w-3.5 h-3.5 text-rose-500/60 group-hover/zine:text-rose-400 group-hover/zine:scale-110 transition-transform" />
                {zineCount !== undefined && (
                    <span className="text-[10px] font-mono font-black text-rose-400/80 group-hover/zine:text-rose-300">
                        {zineCount}
                    </span>
                )}
            </Link>
        </div>
    );
}

