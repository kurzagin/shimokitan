"use client";

import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Icon } from '@iconify/react';
import { Badge } from './Badge';
import { toast } from 'sonner';

// --- Types ---

export interface Track {
    title: string;
    artist: string;
    album?: string;
    cover?: string;
    src: string;
    bitrate?: string;
    format?: string;
}

interface AudioWidgetProps {
    track?: Track | null;
    onClose?: () => void;
}

const EmptyVinyl: React.FC = () => (
    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
        <Icon icon="lucide:radio" width={24} height={24} className="text-zinc-800" />
    </div>
);

export const AudioWidget: React.FC<AudioWidgetProps> = ({ track, onClose }) => {
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [volume, setVolume] = useState<number>(80);
    const audioRef = useRef<HTMLAudioElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [mounted, setMounted] = useState(false);

    // Dragging State
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [hasDragged, setHasDragged] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const widgetRef = useRef<HTMLDivElement>(null);

    // Initialize position to bottom right
    useEffect(() => {
        setMounted(true);
        setPosition({
            x: window.innerWidth - 124,
            y: window.innerHeight - 124
        });
    }, []);

    const isEmpty = !track || !track.src;
    const currentTrack = track || {
        title: "Station_Offline",
        artist: "Waiting_for_Signal",
        album: "---",
        cover: "", // Empty or placeholder
        bitrate: "0 KBPS",
        format: "SILENCE",
        src: ""
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const togglePlay = (e: React.MouseEvent): void => {
        e.stopPropagation();
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        if (error.name !== 'AbortError') console.error(error);
                    });
                }
                setIsPlaying(true);
            }
        } else {
           setIsPlaying(!isPlaying);
        }
    };

    const broadcastState = () => {
        if (!audioRef.current) return;
        const audio = audioRef.current;
        window.dispatchEvent(new CustomEvent('shim_audio_state', {
            detail: {
                isPlaying: !audio.paused,
                currentTime: audio.currentTime,
                duration: audio.duration,
                progress: (audio.currentTime / (audio.duration || 1)) * 100,
                volume: audio.volume * 100
            }
        }));
    };

    // Effect 1: Persistent Event Listeners (Audio + Commands)
    useEffect(() => {
        if (!mounted || !audioRef.current) return;
        const audio = audioRef.current;
        const onPlay = () => { setIsPlaying(true); broadcastState(); };
        const onPause = () => { setIsPlaying(false); broadcastState(); };
        const onTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            setProgress((audio.currentTime / (audio.duration || 1)) * 100);
            broadcastState();
        };
        const onLoadedMetadata = () => {
            setDuration(audio.duration);
            broadcastState();
        };

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);

        const handleCommand = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            console.log("AudioWidget: Command received:", detail);
            if (detail?.type === 'playToggle') {
                if (audio.paused) {
                    console.log("AudioWidget: Attempting play...");
                    if (!audio.src && !hlsRef.current) {
                        console.warn("AudioWidget: Play requested but no source attached.");
                        toast.error("Audio: No source attached. Retrying...");
                        return;
                    }
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.error("AudioWidget: Play error:", error);
                            // Avoid toast on user-initiated pause/cancel
                            if (error.name !== 'AbortError') {
                                toast.error("Audio: Playback failed (Autoplay/CORS issue)");
                            }
                        });
                    }
                } else {
                    console.log("AudioWidget: Pausing playback...");
                    audio.pause();
                }
            } else if (detail?.type === 'seek') {
                audio.currentTime = detail.time;
            } else if (detail?.type === 'volume') {
                setVolume(detail.volume);
                audio.volume = detail.volume / 100;
            }
        };
        window.addEventListener('shim_audio_command', handleCommand);

        // Initial broadcast
        broadcastState();

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            window.removeEventListener('shim_audio_command', handleCommand);
        };
    }, [mounted, audioRef.current]); // Also depend on audioRef.current

    // Effect 2: Source Management
    useEffect(() => {
        if (!mounted || !audioRef.current) return;
        const audio = audioRef.current;
        const targetSrc = track?.src || "";

        if (!targetSrc) {
            if (audio.src && audio.src !== window.location.href) {
                audio.pause();
                audio.src = "";
                setIsPlaying(false);
                broadcastState();
            }
            return;
        }

        let hls: Hls | null = null;
        
        setIsPlaying(false);
        setCurrentTime(0);

        if (Hls.isSupported() && targetSrc.includes('.m3u8')) {
            console.log("AudioWidget: Initializing HLS for", targetSrc);
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                manifestLoadingMaxRetry: 10,
                manifestLoadingRetryDelay: 1000,
                levelLoadingMaxRetry: 10,
                levelLoadingRetryDelay: 1000,
                fragLoadingMaxRetry: 10,
                fragLoadingRetryDelay: 1000,
                xhrSetup: (xhr, url) => {
                    xhr.withCredentials = false;
                }
            });
            hlsRef.current = hls;
            hls.loadSource(targetSrc);
            hls.attachMedia(audio);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                 console.log("AudioWidget: HLS Manifest parsed.");
                 broadcastState();
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.error("AudioWidget: HLS Fatal ERROR:", {
                        type: data.type,
                        details: data.details,
                        response: data.response,
                        url: data.url
                    });
                    
                    switch (data.type) {
                      case Hls.ErrorTypes.NETWORK_ERROR:
                        if (data.details === "manifestLoadError") {
                            const status = (data.response as any)?.status;
                            console.error(`AudioWidget: Manifest load error for ${data.url || 'unknown source'} (Status: ${status}). Retrying in 2s...`);
                            toast.error(`Audio: Connection lost (Status: ${status || 'Unknown'}). Reconnecting...`);
                            setTimeout(() => {
                                if (hlsRef.current === hls) {
                                    hls.startLoad();
                                }
                            }, 2000);
                        } else {
                            console.error(`AudioWidget: Network error (${data.details}). Trying to recover...`);
                            hls.startLoad();
                        }
                        break;
                      case Hls.ErrorTypes.MEDIA_ERROR:
                        console.error("AudioWidget: Media error, trying to recover...");
                        hls.recoverMediaError();
                        break;
                      default:
                        console.error("AudioWidget: Cannot recover, destroying HLS instance.");
                        toast.error(`Audio: Stream terminal failure`);
                        hls.destroy();
                        hlsRef.current = null;
                        break;
                    }
                } else {
                    // Filter out some noisy warnings
                    if (data.details !== 'bufferStalledError') {
                        console.warn("AudioWidget: HLS Warning:", data.details);
                    }
                }
            });
        } else {
            console.log("AudioWidget: Using standard audio element for", targetSrc);
            audio.src = targetSrc;
        }

        broadcastState();

        return () => {
            if (hlsRef.current) {
                console.log("AudioWidget: Cleaning up HLS...");
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [mounted, track?.src, audioRef.current]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100;
        }
    }, [volume]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        setHasDragged(false);
        dragStart.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        e.stopPropagation();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const newX = e.clientX - dragStart.current.x;
            const newY = e.clientY - dragStart.current.y;

            // If we move more than a tiny threshold, count it as a drag
            if (Math.abs(e.clientX - (dragStart.current.x + position.x)) > 5 ||
                Math.abs(e.clientY - (dragStart.current.y + position.y)) > 5) {
                setHasDragged(true);
            }

            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, position.x, position.y]);

    const handleWidgetClick = (e: React.MouseEvent) => {
        if (!isExpanded && !hasDragged) {
            e.stopPropagation();
            setIsExpanded(true);
        }
    };

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
        onClose?.();
    };

    if (!mounted) return null;

    return (
        <>
            <audio ref={audioRef} crossOrigin="anonymous" />
            <div
                ref={widgetRef}
                className="hidden md:block fixed z-[9999] select-none touch-none"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    cursor: isDragging ? 'grabbing' : 'auto'
                }}
            >
            <div
                className="relative group transition-all duration-500"
                onMouseDown={!isExpanded ? handleMouseDown : undefined}
            >
                {/* --- FLOATING WIDGET CONTAINER --- */}
                <div
                    id="music-widget"
                    className={`
            relative bg-zinc-950/60 backdrop-blur-2xl border border-zinc-800/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,1)]
            transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-auto
            ${isExpanded ? 'w-[calc(100vw-4rem)] max-w-2xl h-32 rounded-xl p-0' : 'w-24 h-24 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center ring-4 ring-zinc-900/50'}
          `}
                    onClick={handleWidgetClick}
                >
                    {/* Pulsing Aura for minimized state */}
                    {!isExpanded && isPlaying && (
                        <div className="absolute inset-0 rounded-full bg-violet-500/10 animate-pulse scale-110 pointer-events-none" />
                    )}

                    {/* Minimize/Close buttons for circle state */}
                    {!isExpanded && (
                        <div className="absolute -top-1 -right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                            <button
                                onClick={handleClose}
                                className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-500 shadow-lg border border-rose-400/20"
                                title="Close Signal"
                            >
                                <Icon icon="lucide:x" width={12} />
                            </button>
                        </div>
                    )}

                    {isExpanded && (
                        <div
                            className="absolute top-0 left-0 right-0 h-8 border-b border-zinc-800/50 flex items-center justify-between px-4 bg-zinc-950/60 rounded-t-xl cursor-grab active:cursor-grabbing"
                            onMouseDown={handleMouseDown}
                        >
                            <div className="flex items-center gap-2 text-zinc-500 ml-32 pointer-events-none">
                                <Icon icon="lucide:disc" width={14} height={14} className={isPlaying ? "animate-spin" : ""} />
                                <span className="text-[10px] font-mono tracking-[0.2em] uppercase">Artifact.Audio /// DRAGGABLE_VINYL</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="px-2 py-0.5 rounded bg-violet-900/40 text-violet-200 border border-violet-700/40 text-[9px] font-mono tracking-tighter uppercase whitespace-nowrap">LIVE RESONANCE</div>
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-2" />
                                <div className="h-4 w-px bg-zinc-800 mx-1" />
                                
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                                    className="p-1 text-zinc-500 hover:text-white transition-colors hover:bg-zinc-800 rounded-md cursor-pointer"
                                    title="Minimize to Circle"
                                >
                                    <Icon icon="lucide:minimize-2" width={14} height={14} />
                                </button>

                                <button
                                    onClick={handleClose}
                                    className="p-1 text-rose-500 hover:text-rose-400 transition-colors hover:bg-rose-950/30 rounded-md cursor-pointer"
                                    title="Close Engine"
                                >
                                    <Icon icon="lucide:x" width={14} height={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={`flex items-center h-full ${isExpanded ? 'pt-8' : ''}`}>

                        {/* --- VINYL RECORD AREA --- */}
                        <div
                            className={`
                relative flex-shrink-0 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                ${isExpanded ? 'w-40 h-40 -ml-16' : 'w-24 h-24'}
              `}
                        >
                            {/* The Spinning Disc */}
                            <div
                                className={`
                w-full h-full rounded-full border border-zinc-800
                flex items-center justify-center bg-zinc-950 overflow-hidden relative
                ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : 'transition-transform duration-1000'}
                shadow-[0_0_30px_rgba(139,92,246,0.15)]
              `}
                            >
                                {/* Groove Texture */}
                                <div className="absolute inset-2 rounded-full border border-zinc-900" />
                                <div className="absolute inset-4 rounded-full border border-zinc-900" />
                                <div className="absolute inset-6 rounded-full border border-zinc-900" />
                                <div className="absolute inset-8 rounded-full border border-zinc-900" />



                                <div className="relative w-[42%] h-[42%] rounded-full overflow-hidden border-[3px] border-zinc-950 z-10 pointer-events-none">
                                    {currentTrack.cover ? (
                                        <img
                                            src={currentTrack.cover}
                                            className="w-full h-full object-cover"
                                            alt="cover"
                                            draggable="false"
                                        />
                                    ) : <EmptyVinyl />}
                                </div>

                                {/* Spindle */}
                                <div className="absolute w-2.5 h-2.5 bg-zinc-400 rounded-full border border-zinc-950 z-20" />
                            </div>

                            {/* --- ENHANCED STYLUS (TONE ARM) --- */}
                            {isExpanded && (
                                <div
                                    className={`absolute -right-2 top-0 w-24 h-32 origin-top transition-transform duration-1000 ease-[cubic-bezier(0.45,0.05,0.55,0.95)] z-20
                  ${isPlaying ? 'rotate-[20deg]' : 'rotate-[-12deg]'}
                `}
                                    style={{ transformOrigin: '80% 15%' }}
                                >
                                    {/* Main Pivot Base */}
                                    <div className="absolute top-0 right-2 w-14 h-14 bg-zinc-900 rounded-full shadow-[4px_4px_0px_rgba(0,0,0,0.5)] flex items-center justify-center border border-zinc-800">
                                        <div className="w-10 h-10 bg-zinc-800 rounded-full border border-zinc-700 flex items-center justify-center">
                                            <div className="w-8 h-8 bg-zinc-700 rounded-full border border-zinc-900 flex items-center justify-center shadow-inner">
                                                <div className="w-2 h-2 bg-zinc-500 rounded-full" />
                                            </div>
                                        </div>
                                        {/* Counterweight */}
                                        <div className="absolute -top-7 right-0 w-7 h-12 bg-zinc-700 rounded-sm border-x border-b border-zinc-800 shadow-[2px_2px_0px_rgba(0,0,0,0.4)] transform rotate-[-15deg]" />
                                    </div>

                                    {/* Arm Tube */}
                                    <div className="absolute right-[30px] top-6 w-[8px] h-28 bg-zinc-400 rounded-full origin-top rotate-[5deg] overflow-hidden border-x border-zinc-500">
                                        <div className="absolute inset-y-0 left-0 w-[1px] bg-white/40" />
                                        <div className="absolute inset-y-0 right-0 w-[2px] bg-black/20" />
                                    </div>

                                    {/* Headshell & Needle Assembly */}
                                    <div className="absolute bottom-[-18px] left-[14px] w-8 h-12 flex flex-col items-center transform rotate-[20deg]">
                                        <div className="w-6 h-10 bg-zinc-900 rounded-t-sm rounded-br-2xl border-l-2 border-zinc-800 relative shadow-[4px_4px_0px_rgba(0,0,0,0.4)]">
                                            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10" />
                                            <div className="absolute top-1 -right-4 w-5 h-1.5 bg-zinc-800 rounded-full rotate-[-30deg] border-b border-black/40" />
                                        </div>
                                        <div className="w-3 h-4 bg-rose-600 rounded-b-sm mt-[-2px] ml-2 z-30 border-x border-b border-rose-800 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] flex flex-col items-center">
                                            <div className="w-full h-[1px] bg-white/20" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* --- CONTENT AREA --- */}
                        {isExpanded && (
                            <div className="flex-1 flex items-center justify-between ml-10 mr-4 transition-all duration-500">
                                {/* Track Info */}
                                <div className="flex flex-col shrink w-32 md:w-48 pl-2 pr-4 md:px-6 overflow-hidden">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="zinc">{currentTrack.format}</Badge>
                                        <span className="text-[8px] font-mono text-zinc-600 uppercase hidden md:inline">
                                            {currentTrack.bitrate}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-black tracking-tighter uppercase italic leading-none text-white truncate">
                                        {currentTrack.title}
                                    </h3>
                                    <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider mt-1.5 flex items-center gap-2 truncate">
                                        <span className="w-4 h-px bg-zinc-800 shrink-0 hidden md:block" />
                                        <span className="truncate">{currentTrack.artist}</span>
                                    </p>
                                </div>

                                {/* Controls & Progress */}
                                <div className="flex flex-col items-center flex-1 px-4 md:px-6 border-x border-zinc-800/30 h-full justify-center min-w-[120px]">
                                    <div className="flex items-center gap-6 md:gap-10 mb-4">
                                        <button className="text-zinc-500 hover:text-white transition-all transform hover:scale-110 active:scale-90">
                                            <Icon icon="lucide:skip-back" width={18} height={18} />
                                        </button>
                                        <button
                                            onClick={togglePlay}
                                            disabled={isEmpty}
                                            className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-110 active:scale-90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:bg-zinc-800 disabled:text-zinc-600 disabled:scale-100 disabled:shadow-none shrink-0"
                                        >
                                            <Icon icon={isPlaying ? "lucide:pause" : "lucide:play"} width={20} height={20} />
                                        </button>
                                        <button className="text-zinc-500 hover:text-white transition-all transform hover:scale-110 active:scale-90">
                                            <Icon icon="lucide:skip-forward" width={18} height={18} />
                                        </button>
                                    </div>

                                    {/* Scrubber */}
                                    <div className="w-full flex items-center gap-2 md:gap-4 text-[10px] text-zinc-600 font-black font-mono">
                                        <span className="w-8 text-right tracking-tight shrink-0">{formatTime(currentTime)}</span>
                                        <div 
                                           className="flex-1 h-1 bg-zinc-800 rounded-full relative group cursor-pointer overflow-hidden min-w-[50px]"
                                           onMouseDown={(e) => {
                                               e.preventDefault();
                                               if (!audioRef.current) return;
                                               const target = e.currentTarget as HTMLElement;
                                               const audio = audioRef.current;
                                               
                                               const update = (clientX: number) => {
                                                   const rect = target.getBoundingClientRect();
                                                   const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                                                   audio.currentTime = pos * (audio.duration || 0);
                                               };

                                               update(e.clientX);

                                               const onMouseMove = (moveEvent: MouseEvent) => {
                                                   update(moveEvent.clientX);
                                               };
                                               const onMouseUp = () => {
                                                   document.removeEventListener('mousemove', onMouseMove);
                                                   document.removeEventListener('mouseup', onMouseUp);
                                               };
                                               document.addEventListener('mousemove', onMouseMove);
                                               document.addEventListener('mouseup', onMouseUp);
                                           }}
                                         >
                                             <div
                                                 className="absolute top-0 left-0 h-full bg-violet-600 rounded-full pointer-events-none transition-all duration-100 ease-linear"
                                                 style={{ width: `${progress}%` }}
                                             />
                                         </div>
                                        <span className="w-8 tracking-tight shrink-0">{formatTime(duration)}</span>
                                    </div>
                                </div>

                                {/* Volume */}
                                <div className="flex items-center gap-2 md:gap-3 w-20 md:w-28 shrink-0 group pl-4 pr-4 md:pr-6">
                                    <Icon icon="lucide:volume-2" width={16} height={16} className="text-zinc-600 group-hover:text-white transition-colors flex-shrink-0" />
                                    <div 
                                        className="flex-1 h-6 flex items-center cursor-pointer"
                                        onMouseDown={(e) => {
                                             e.preventDefault();
                                             const target = e.currentTarget as HTMLElement;
                                             
                                             const update = (clientX: number) => {
                                                 const rect = target.getBoundingClientRect();
                                                 const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                                                 setVolume(pos * 100);
                                             };

                                             update(e.clientX);

                                             const onMouseMove = (moveEvent: MouseEvent) => {
                                                 update(moveEvent.clientX);
                                             };
                                             
                                             const onMouseUp = () => {
                                                 document.removeEventListener('mousemove', onMouseMove);
                                                 document.removeEventListener('mouseup', onMouseUp);
                                             };

                                             document.addEventListener('mousemove', onMouseMove);
                                             document.addEventListener('mouseup', onMouseUp);
                                         }}
                                    >
                                        <div className="w-full h-1 bg-zinc-800 rounded-full relative pointer-events-none overflow-hidden">
                                            <div
                                                className="absolute top-0 left-0 h-full bg-zinc-500 group-hover:bg-violet-500 rounded-full transition-all duration-75"
                                                style={{ width: `${volume}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Play Button Overlay for Minimized State */}
                        {!isExpanded && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className={`w-12 h-12 rounded-full border border-violet-500/30 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-opacity ${isPlaying ? 'opacity-0' : 'opacity-100 group-hover:opacity-100'}`}>
                                    <button
                                        onClick={togglePlay}
                                        disabled={isEmpty}
                                        className={`pointer-events-auto w-10 h-10 flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed`}
                                    >
                                        <Icon icon={isPlaying ? "lucide:pause" : "lucide:play"} width={24} height={24} className="text-white ml-1" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </div>
        </>
    );
};
