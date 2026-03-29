"use client";

import React from 'react';
import { Icon } from '@iconify/react';
import { useStationStore, StationTrack } from '@/lib/store/station-store';

interface PlayButtonProps {
    track: StationTrack;
    className?: string;
}

export function PlayButton({ track, className }: PlayButtonProps) {
    const { setTrack, currentTrack, isInitialized } = useStationStore();
    
    const isPlaying = isInitialized && currentTrack?.src === track.src;

    const handlePlay = () => {
        setTrack(track);
    };

    return (
        <button
            onClick={handlePlay}
            className={className}
        >
            <Icon icon={isPlaying ? "lucide:pause" : "lucide:play"} width={16} />
            {isPlaying ? "RESONANCE_ACTIVE" : "INIT_RESONANCE"}
        </button>
    );
}
