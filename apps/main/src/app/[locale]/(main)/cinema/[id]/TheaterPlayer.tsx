'use client';

import React, { useEffect, useRef } from 'react';
import { useTheaterStore, TheaterVideo } from '@/lib/store/theater-store';

interface Props {
    initialVideo: TheaterVideo | null;
    defaultThumbnail?: string | null;
}

export function TheaterPlayer({ initialVideo, defaultThumbnail }: Props) {
    const { activeVideo, setActiveVideo } = useTheaterStore();
    
    // Initialize active video on mount if there's no active video or if initial video changes
    const initializedRef = useRef<string | null>(null);
    useEffect(() => {
        if (initialVideo && (!activeVideo || initializedRef.current !== initialVideo.id)) {
            setActiveVideo(initialVideo);
            initializedRef.current = initialVideo.id;
        }
    }, [initialVideo, activeVideo, setActiveVideo]);

    const video = activeVideo || initialVideo;

    if (!video || (!video.url && !defaultThumbnail)) {
        return (
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <img src={defaultThumbnail || undefined} className="w-full h-full object-cover opacity-60 mix-blend-screen" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 w-full h-full">
            {video.platform === 'youtube' ? (
                <iframe
                    src={`https://www.youtube.com/embed/${video.url.includes('v=')
                        ? video.url.split('v=')[1].split('&')[0]
                        : video.url.split('/').pop()
                        }?autoplay=1`}
                    className="w-full h-full border-0 z-10"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <img src={video.thumbnailUrl || defaultThumbnail || undefined} className="w-full h-full object-cover opacity-60 mix-blend-screen" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                </div>
            )}
        </div>
    );
}
