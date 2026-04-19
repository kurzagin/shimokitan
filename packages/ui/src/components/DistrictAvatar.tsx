import React from 'react';
import { Icon } from '@iconify/react';
import { cn } from '../lib/utils';

interface DistrictAvatarProps {
    src?: string | null;
    fallbackSrc?: string | null;
    alt?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    shape?: 'square' | 'rounded' | 'circle';
    className?: string;
}

const SIZE_MAP = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
};

const SHAPE_MAP = {
    square: 'rounded-none',
    rounded: 'rounded-sm',
    circle: 'rounded-full'
};

const ICON_SIZE_MAP = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 32,
    xl: 48
};

/**
 * Enterprise-grade Avatar component for Shimokitan District.
 * Prioritizes high-fidelity media assets with graceful fallbacks.
 */
export function DistrictAvatar({
    src,
    fallbackSrc,
    alt = '',
    size = 'md',
    shape = 'square',
    className
}: DistrictAvatarProps) {
    const avatarUrl = src || fallbackSrc;

    return (
        <div className={cn(
            "shrink-0 bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center relative group",
            SIZE_MAP[size],
            SHAPE_MAP[shape],
            className
        )}>
            {avatarUrl ? (
                <img 
                    src={avatarUrl} 
                    alt={alt} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
            ) : (
                <div className="text-zinc-700">
                    <Icon icon="lucide:user" width={ICON_SIZE_MAP[size]} />
                </div>
            )}
            
            {/* Decorative Overlay for premium feel */}
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/5 to-transparent pointer-events-none" />
        </div>
    );
}
