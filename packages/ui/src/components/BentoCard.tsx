"use client"

import React from 'react';
import { Icon } from '@iconify/react';
import { cn } from "../lib/utils";

interface BentoCardProps {
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
    title?: string;
    icon?: string;
    headerAction?: React.ReactNode;
    minimal?: boolean;
}

export const BentoCard = ({
    children,
    className = "",
    contentClassName = "",
    title,
    icon,
    headerAction,
    minimal = false
}: BentoCardProps) => (
    <div className={cn(
        "relative group bg-zinc-900/80 border border-zinc-800/80 rounded-xl overflow-hidden hover:border-violet-500/50 transition-all duration-300 backdrop-blur-xl flex flex-col",
        className
    )}>
        {/* Background Decorative Grid */}
        <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />

        {/* Technical Marking - Top Right */}
        <div className="absolute top-1 right-1 flex gap-0.5 pointer-events-none opacity-40">
            <div className="w-1 h-1 bg-zinc-700 rounded-full" />
            <div className="w-1 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Technical Marking - Corners */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-700/50 rounded-tl-sm pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-700/50 rounded-br-sm pointer-events-none" />

        {!minimal && (
            <div className="flex items-center h-8 px-4 bg-zinc-950/50 border-b border-zinc-800/50 z-10">
                <div className="flex items-center gap-2 text-zinc-500 group-hover:text-violet-400 transition-colors">
                    {icon && <Icon icon={icon} width={10} height={10} />}
                    {title && <span className="text-[9px] font-mono tracking-[0.2em] uppercase font-black">{title}</span>}
                </div>
                <div className="flex-1" />
                {headerAction && <div className="text-zinc-600 hover:text-white cursor-pointer transition-colors z-20">{headerAction}</div>}
            </div>
        )}

        <div className={cn("relative z-10 flex-1 flex flex-col min-h-0", minimal ? "h-full" : "h-[calc(100%-2rem)]", !minimal && "p-4", contentClassName)}>
            {children}
        </div>

        {/* Hover Highlight Layer (No Gradients) */}
        <div className="absolute inset-0 bg-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
);
