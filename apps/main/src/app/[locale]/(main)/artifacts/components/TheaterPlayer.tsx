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

    const renderVideoPlayer = () => {
        // Platform inference from URL if the provided platform is not a standard video platform
        let effectivePlatform = video.platform;
        const lowUrl = video.url.toLowerCase();
        
        if (effectivePlatform !== 'youtube' && effectivePlatform !== 'bilibili' && effectivePlatform !== 'niconico') {
            if (lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be')) {
                effectivePlatform = 'youtube';
            } else if (lowUrl.includes('bilibili.com')) {
                effectivePlatform = 'bilibili';
            } else if (lowUrl.includes('nicovideo.jp')) {
                effectivePlatform = 'niconico';
            }
        }

        if (effectivePlatform === 'youtube') {
            const videoId = video.url.includes('v=')
                ? video.url.split('v=')[1].split('&')[0]
                : video.url.split('/').pop()?.split('?')[0];
            return (
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    className="w-full h-full border-0 z-10"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            );
        }

        if (effectivePlatform === 'bilibili') {
            const bvid = video.url.split('/').pop()?.split('?')[0];
            return (
                <iframe
                    src={`https://player.bilibili.com/player.html?bvid=${bvid}`}
                    className="w-full h-full border-0 z-10 shadow-2xl"
                    allowFullScreen
                    scrolling="no"
                />
            );
        }

        if (effectivePlatform === 'niconico') {
            const nicoId = video.url.split('/').pop()?.split('?')[0];
            return (
                <iframe
                    src={`https://embed.nicovideo.jp/watch/${nicoId}?jsapi=1`}
                    className="w-full h-full border-0 z-10"
                    allowFullScreen
                />
            );
        }

        return (
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <img src={video.thumbnailUrl || defaultThumbnail || undefined} className="w-full h-full object-cover opacity-60 mix-blend-screen" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            </div>
        );
    };

    return (
        <div className="absolute inset-0 w-full h-full">
            {renderVideoPlayer()}
        </div>
    );
}
