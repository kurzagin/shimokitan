"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { BentoCard, Badge, cn, Track } from "@shimokitan/ui";
import { useTime } from "../../hooks/use-time";
import Link from "../../components/Link";
import Image from "next/image";
import { Dictionary, getEntityUrl } from "@shimokitan/utils";
import { useStationStore } from "../../lib/store/station-store";

type Artifact = {
  id: string;
  title: string;
  category: string;
  thumbnailImage: string | null;
  posterImage: string | null;
  description: string | null;
  resonance: number | null;
  specs: any;
  videoUrl?: string | null;
};


type Transmission = {
  id: string;
  type: "issue" | "editorial" | "changelog" | "broadcast";
  title: string;
  topic: string | null;
  content: string;
  severity: "critical" | "high" | "monitoring" | "resolved" | null;
  affectedUsers: number | null;
  publishedAt: Date | string | null;
  description?: string;
  attachmentUrl?: string | null;
};

export default function HomeClient({
  spotlightArtifacts,
  featuredArtifact,
  videoArtifact,
  entities,
  weatherTemp,
  totalResonance,
  artifactCount,
  entityCount,
  transmissions,
  dict,
  currentTrack,
  archiveArtifacts,
}: {
  spotlightArtifacts: Artifact[];
  featuredArtifact: Artifact | null;
  videoArtifact: Artifact | null;
  archiveArtifacts: Artifact[];
  entities: any[];
  weatherTemp: string;
  totalResonance: string;
  transmissions: Transmission[];
  artifactCount: number;
  entityCount: number;
  dict: Dictionary;
  currentTrack?: Track | null;
}) {
  const [activeSpotlight, setActiveSpotlight] = useState<number>(0);
  const [activeEntity, setActiveEntity] = useState<number>(0);
  const [activeSignal, setActiveSignal] = useState<number>(0);
  const station = useStationStore();

  const [audioState, setAudioState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    progress: 0,
    volume: station.volume || 80,
  });

  const [randomFreq, setRandomFreq] = useState<string>("000");
  const time = useTime();

  useEffect(() => {
    const handleState = (e: Event) => {
      setAudioState((e as CustomEvent).detail);
    };
    window.addEventListener("shim_audio_state", handleState);
    return () => window.removeEventListener("shim_audio_state", handleState);
  }, []);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const dispatchCommand = (type: string, payload: any = {}) => {
    if (type === "volume") {
      station.setVolume(payload.volume);
    }
    window.dispatchEvent(
      new CustomEvent("shim_audio_command", { detail: { type, ...payload } })
    );
  };

  useEffect(() => {
    if (transmissions.length === 0) return;
    const signalInterval = setInterval(() => {
      setActiveSignal((prev) => (prev + 1) % transmissions.length);
    }, 8000);
    return () => clearInterval(signalInterval);
  }, [transmissions.length]);

  useEffect(() => {
    setRandomFreq(Math.floor(Math.random() * 1000).toString(16));
  }, []);

  const heroArtifact = spotlightArtifacts[0];
  // Determine if the database is effectively empty/wiped
  const isDataEmpty = spotlightArtifacts.length === 0 && entities.length === 0;
  
  // Audio-specific wipe: If no hosted audio exists at all on the server, any local audio state is likely stale seeder data
  const shouldResetAudio = !currentTrack;

  // Sync Store with DB State: If the system is wiped or has no music, reset the local audio cache
  useEffect(() => {
    if (shouldResetAudio && station.currentTrack && !station.isClosed) {
      console.log("SHIM_SYSTEM: No hosted audio found on server. Clearing local cache.");
      station.reset();
    }
  }, [shouldResetAudio]);

  // Force-Sync: If server has a new track (e.g. after a re-upload), update the local store immediately
  useEffect(() => {
    if (currentTrack?.src && station.currentTrack?.src !== currentTrack.src) {
      console.log("SHIM_SYSTEM: Syncing local store with updated server media...");
      // Cast safely as the server-side track is built with defaults in page.tsx
      station.initialize(currentTrack as any);
    }
  }, [currentTrack, station.currentTrack?.src]);

  // If server reports no music and no artifacts, we ignore the local store to prevent "ghost" records
  const trackToDisplay = shouldResetAudio ? null : (station.currentTrack || currentTrack);
  const hasTrack = !!(trackToDisplay?.src);
  
  // LIVE_CENTER should be visually active if there's a track, regardless of the 'closed' toggle (which is for the floating widget)
  const isDockedActive = hasTrack;

  return (
    <div className="
      grid gap-3 h-auto
      grid-cols-2
      sm:grid-cols-3 sm:grid-rows-2 sm:h-full
      lg:grid-cols-5 lg:grid-rows-7 lg:h-full
    ">

      {/* ── 1. Hero / District Branding ─────────────────────────────────────*/}
      <div className="
        col-span-2 min-h-[280px]
        sm:col-span-2 sm:row-span-1 sm:col-start-1 sm:row-start-1 sm:min-h-0
        lg:col-span-2 lg:row-span-3 lg:col-start-1 lg:row-start-1
        relative group rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl
      ">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/tokyo.jpg"
            alt="Tokyo street scene"
            fill
            priority
            className="object-cover object-[35%_center] opacity-40 group-hover:opacity-60 transition-all duration-1000 grayscale group-hover:grayscale-[0.3] scale-105 group-hover:scale-100"
          />
          <div className="absolute inset-0 bg-linear-to-br from-zinc-950/90 via-zinc-950/40 to-zinc-950/90" />
          <div className="absolute inset-0 bg-zinc-950/20 mix-blend-overlay" />
        </div>

        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none z-40 opacity-[0.08] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_3px)]" />

        <div className="h-full relative z-20 group/hero">
          {/* Left Vertical Branding Strip — desktop only */}
          <div className="hidden lg:flex absolute left-0 top-0 bottom-0 w-[80px] border-r border-white/10 bg-zinc-950/80 backdrop-blur-md flex-col items-center py-10 z-30">
            <div className="text-[10px] font-mono text-zinc-500 uppercase [writing-mode:vertical-lr] rotate-180 tracking-[0.5em] font-black italic mb-12">
              DISTRICT _ SYSTEM
            </div>
            <div className="flex flex-col gap-1.5 items-center">
              {"SHIMOKITAN".split("").map((char, i) => (
                <span
                  key={i}
                  className="text-xl font-black text-white/20 transition-all duration-500 group-hover/hero:text-white group-hover/hero:scale-110"
                  style={{ transitionDelay: `${i * 30}ms` }}
                >
                  {char}
                </span>
              ))}
            </div>
            <div className="mt-auto flex flex-col items-center gap-4">
              <div className="w-px h-12 bg-linear-to-b from-transparent via-violet-500 to-transparent animate-pulse" />
              <div className="text-[8px] font-mono text-violet-500 uppercase [writing-mode:vertical-lr] rotate-180 tracking-widest font-black opacity-60">
                ACTIVE_LINK
              </div>
            </div>
          </div>

          {/* Main Cinematic Viewport */}
          <div className="relative overflow-hidden h-full lg:ml-[80px]">
            {/* HUD Corners */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/20 z-30" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/20 z-30" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/20 z-30" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-white/20 z-30" />

            {/* Top Info Bar */}
            <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-30 pointer-events-none">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-rose-500 uppercase italic tracking-tighter bg-rose-500/10 px-2 py-0.5 border-l-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]">
                  Emergent_Feed
                </div>
                <div className="text-[8px] font-mono text-zinc-400 uppercase tracking-[0.3em]">
                  Timestamp::{time.replace(/:/g, ".")}
                </div>
              </div>

              <div className="flex gap-2 pointer-events-auto">
                {[
                  { href: "/cinema", icon: "lucide:archive" },
                  { href: "/artists", icon: "lucide:users" },
                  {
                    href: "https://signal.shimokitan.live",
                    icon: "lucide:radio",
                    external: true,
                  },
                ].map((port, i) => (
                  <Link
                    key={i}
                    href={port.href}
                    target={port.external ? "_blank" : undefined}
                    className="w-10 h-10 flex items-center justify-center bg-zinc-950/90 border border-white/10 text-zinc-400 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/10 transition-all group/port shadow-2xl"
                  >
                    <Icon
                      icon={port.icon}
                      width={14}
                      className="group-hover/port:scale-110 transition-transform"
                    />
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom Title Overlay */}
            <div className="absolute bottom-10 left-8 right-8 z-50 pointer-events-none">
              <div className="space-y-0.5 mb-2">
                <span className="text-[10px] font-black text-violet-500 uppercase tracking-[0.4em] block drop-shadow-sm italic">
                  SECTOR _ SHIMOKITAZAWA
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-[0_8px_24px_rgba(0,0,0,1)]">
                  SHIMO<span className="text-violet-500">KITAN</span>
                </h1>
              </div>
              <div className="p-4 border-l-2 border-violet-500/50 bg-zinc-950/90 backdrop-blur-md max-w-sm shadow-2xl">
                <p className="text-[11px] sm:text-xs font-bold text-zinc-200 italic leading-snug">
                  &ldquo;{dict.home.tagline}&rdquo;
                </p>
              </div>
            </div>

            {/* Viewport Effects */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className="absolute inset-y-0 left-1/4 w-px bg-white/5" />
              <div className="absolute inset-y-0 left-2/4 w-px bg-white/5" />
              <div className="absolute inset-y-0 left-3/4 w-px bg-white/5" />
              <div className="w-full h-px bg-violet-500/20 absolute top-0 animate-[scan_8s_linear_infinite]" />
            </div>

            {/* Photo Attribution */}
            <div className="absolute bottom-4 right-4 z-40 opacity-0 group-hover/hero:opacity-40 transition-opacity duration-700 pointer-events-none group-hover/hero:pointer-events-auto">
              <p className="text-[7px] font-mono text-zinc-500 uppercase tracking-[0.2em] whitespace-nowrap bg-zinc-950/80 p-2 backdrop-blur-sm">
                Photo by{" "}
                <a
                  href="https://unsplash.com/@rojiurayokocho?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-violet-400 underline transition-colors"
                >
                  露地裏 横丁
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Current Signal / Audio Player ────────────────────────────────*/}
      <BentoCard
        className="
          col-span-2 min-h-[360px]
          sm:col-span-1 sm:row-span-1 sm:col-start-3 sm:row-start-1 sm:min-h-0
          lg:col-span-1 lg:row-span-3 lg:col-start-3 lg:row-start-1
          p-0 overflow-hidden
        "
        title="Current Signal"
        icon="lucide:radio"
        minimal
      >
        <div className="flex flex-col h-full relative z-60 pointer-events-auto">
          {/* Header */}
          <div className="h-9 border-b border-zinc-800/50 flex items-center justify-between px-4 bg-zinc-950/40 shrink-0 relative z-70">
            <div className="flex items-center gap-2 text-zinc-500">
              <Icon
                icon="lucide:disc"
                width={12}
                className={isDockedActive ? "animate-spin" : ""}
              />
              <span className="text-[9px] font-mono tracking-[0.15em] uppercase">
                LIVE_CENTER
              </span>
            </div>
            <div className="flex items-center gap-2">
              {(station.isMinimized || station.isClosed) ? (
                <button
                  onClick={() => {
                    station.setClosed(false);
                    station.setMinimized(true);
                  }}
                  className="flex items-center justify-center p-1 hover:bg-zinc-800 rounded-md transition-colors text-zinc-500 hover:text-white pointer-events-auto"
                  title="Launch Audio Engine"
                >
                  <Icon icon="lucide:external-link" width={12} />
                </button>
              ) : station.isInitialized && (
                <button
                  onClick={() => station.setMinimized(true)}
                  className="hidden lg:flex items-center justify-center p-1 hover:bg-zinc-800 rounded-md transition-colors text-zinc-500 hover:text-white pointer-events-auto"
                  title="Float Player"
                >
                  <Icon icon="lucide:minus" width={12} />
                </button>
              )}
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  isDockedActive && !station.isClosed
                    ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                    : "bg-zinc-800"
                )}
              />
            </div>
          </div>

          {/* Vinyl & Tonearm */}
          <div className="flex-1 flex flex-col items-center justify-center relative p-4 min-h-0">
            <div className="relative group/vinyl">
              <div
                className={cn(
                  "w-32 h-32 lg:w-36 lg:h-36 rounded-full border border-zinc-800 flex items-center justify-center bg-zinc-950 overflow-hidden relative shadow-[0_24px_48px_-12px_rgba(0,0,0,1)] transition-all duration-700",
                  audioState.isPlaying && !station.isMinimized && !station.isClosed
                    ? "animate-[spin_4s_linear_infinite]"
                    : isDockedActive
                      ? ""
                      : "scale-95 opacity-60 grayscale-[0.3]"
                )}
              >
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full border border-zinc-900"
                    style={{ inset: `${(i + 1) * 1.5}rem` }}
                  />
                ))}
                <div className="relative w-[42%] h-[42%] rounded-full overflow-hidden border-[3px] border-zinc-950 z-10 shadow-lg">
                  {trackToDisplay?.cover ? (
                    <img
                      src={trackToDisplay?.cover}
                      className={cn(
                        "w-full h-full object-cover transition-opacity duration-700",
                        !isDockedActive && "opacity-40"
                      )}
                      alt="current Signal"
                      onError={(e) => {
                        // Fallback for broken images (like deleted seeder assets)
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={cn("w-full h-full bg-zinc-900 flex items-center justify-center", trackToDisplay?.cover ? "hidden" : "")}>
                    <Icon
                      icon="lucide:radio"
                      width={24}
                      height={24}
                      className="text-zinc-800"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/10" />
                </div>
                <div className="absolute w-2 h-2 bg-zinc-400 rounded-full border border-zinc-950 z-20" />
              </div>

              {/* Tonearm */}
              <div
                className={cn(
                  "absolute -right-3 top-0 w-20 h-24 origin-top transition-transform duration-1000 ease-[cubic-bezier(0.45,0.05,0.55,0.95)] z-20 pointer-events-none",
                  audioState.isPlaying && !station.isMinimized && !station.isClosed ? "rotate-20" : "-rotate-12"
                )}
                style={{ transformOrigin: "80% 15%" }}
              >
                <div className="absolute top-0 right-1 w-10 h-10 bg-zinc-900 rounded-full shadow-[3px_3px_0px_rgba(0,0,0,0.5)] flex items-center justify-center border border-zinc-800">
                  <div className="w-7 h-7 bg-zinc-800 rounded-full border border-zinc-700 flex items-center justify-center">
                    <div className="w-5 h-5 bg-zinc-700 rounded-full border border-zinc-900 flex items-center justify-center shadow-inner">
                      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                    </div>
                  </div>
                  <div className="absolute -top-5 right-0 w-5 h-9 bg-zinc-700 rounded-sm border-x border-b border-zinc-800 shadow-[2px_2px_0_rgba(0,0,0,0.4)] transform rotate-[-15deg]" />
                </div>
                <div className="absolute right-[20px] top-4 w-[5px] h-20 bg-zinc-400 rounded-full origin-top rotate-[5deg] overflow-hidden border-x border-zinc-500">
                  <div className="absolute inset-y-0 left-0 w-px bg-white/40" />
                  <div className="absolute inset-y-0 right-0 w-px bg-black/20" />
                </div>
                <div className="absolute bottom-[-12px] left-[10px] w-6 h-9 flex flex-col items-center transform rotate-20">
                  <div className="w-4 h-7 bg-zinc-900 rounded-t-sm rounded-br-xl border-l-2 border-zinc-800 relative shadow-[3px_3px_0px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 left-0 w-full h-px bg-white/10" />
                    <div className="absolute top-1 -right-3 w-3 h-1 bg-zinc-800 rounded-full rotate-[-30deg] border-b border-black/40" />
                  </div>
                  <div className="w-2 h-3 bg-rose-600 rounded-b-sm mt-[-2px] ml-1 z-30 border-x border-b border-rose-800 shadow-[2px_2px_0px_rgba(0,0,0,0.5)]" />
                </div>
              </div>
            </div>

            {/* Track Info */}
            <div className="mt-3 flex flex-col items-center">
              {!hasTrack ? (
                <div className="flex flex-col items-center animate-pulse">
                  <div className="flex items-center gap-2 mb-1 opacity-50">
                    <span className="text-[8px] font-mono text-zinc-600 uppercase">SEARCHING...</span>
                  </div>
                  <h3 className="text-sm font-black tracking-tighter uppercase italic leading-none text-zinc-800">
                    SIGNAL_NOT_FOUND
                  </h3>
                  <p className="text-[9px] font-mono font-bold uppercase tracking-widest mt-1 text-zinc-900">
                    Waiting for Resonance
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="zinc">{trackToDisplay?.format || "null"}</Badge>
                    <span className="text-[8px] font-mono text-zinc-600 uppercase">
                      {trackToDisplay?.bitrate || "0_kbps"}
                    </span>
                  </div>
                  <h3
                    className={cn(
                      "text-sm font-black tracking-tighter uppercase italic leading-none transition-colors",
                      isDockedActive ? "text-white" : "text-zinc-700"
                    )}
                  >
                    {trackToDisplay?.title || "Station_Offline"}
                  </h3>
                  <p
                    className={cn(
                      "text-[9px] font-mono font-bold uppercase tracking-widest mt-1",
                      isDockedActive ? "text-violet-500" : "text-zinc-800"
                    )}
                  >
                    {trackToDisplay?.artist || "Awaiting Input..."}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="p-3 bg-zinc-900/30 border-t border-zinc-900 space-y-2 shrink-0 relative z-100 pointer-events-auto">
            <div className="w-full flex items-center gap-2 text-[9px] text-zinc-500 font-mono font-black italic">
              <span className="w-7 text-right">
                {formatTime(audioState.currentTime)}
              </span>
              <div
                className="flex-1 h-3 flex items-center group/seek cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget as HTMLElement;
                  const update = (clientX: number) => {
                    const rect = target.getBoundingClientRect();
                    const pos = Math.max(
                      0,
                      Math.min(1, (clientX - rect.left) / rect.width)
                    );
                    dispatchCommand("seek", { time: pos * audioState.duration });
                  };
                  update(e.clientX);

                  const onMouseMove = (moveEvent: MouseEvent) => {
                    update(moveEvent.clientX);
                  };
                  const onMouseUp = () => {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                  };
                  document.addEventListener("mousemove", onMouseMove);
                  document.addEventListener("mouseup", onMouseUp);
                }}
              >
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden pointer-events-none relative">
                  <div
                    className="absolute top-0 left-0 h-full bg-violet-600 transition-all duration-100 linear"
                    style={{
                      width: isDockedActive ? `${audioState.progress}%` : "0%",
                    }}
                  />
                </div>
              </div>
              <span className="w-7">{formatTime(audioState.duration)}</span>
            </div>

            <div className="flex items-center justify-center gap-4 relative z-50">
              <button
                disabled={!isDockedActive}
                className="text-zinc-600 hover:text-white transition-colors disabled:opacity-50"
              >
                <Icon icon="lucide:skip-back" width={14} />
              </button>
              <button
                onClick={() => {
                  console.log("HomeClient: Play button clicked.");
                  if (station.isInitialized && station.currentTrack?.src) {
                    console.log("HomeClient: Station is initialized, dispatching playToggle.");
                    if (station.isClosed) station.setClosed(false);
                    dispatchCommand("playToggle");
                  } else if (currentTrack?.src) {
                    console.log("HomeClient: First-time initialization for", currentTrack.title);
                    station.initialize(currentTrack as any);
                    // Wait a bit longer for the store to persist and AudioWidget to load the source
                    setTimeout(() => {
                      console.log("HomeClient: Dispatching deferred playToggle.");
                      dispatchCommand("playToggle");
                    }, 500);
                  } else {
                    console.warn("HomeClient: No track source available to play");
                  }
                }}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300",
                  isDockedActive
                    ? "bg-white text-black shadow-lg"
                    : "bg-zinc-800 text-zinc-600 border border-zinc-700"
                )}
              >
                <Icon
                  icon={audioState.isPlaying ? "lucide:pause" : "lucide:play"}
                  width={16}
                  className={!audioState.isPlaying ? "ml-0.5" : ""}
                />
              </button>
              <button
                disabled={!isDockedActive}
                className="text-zinc-600 hover:text-white transition-colors disabled:opacity-50"
              >
                <Icon icon="lucide:skip-forward" width={14} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 mx-auto w-24">
              <Icon
                icon="lucide:volume-2"
                width={12}
                className={cn(isDockedActive ? "text-white" : "text-zinc-600")}
              />
              <div
                className="flex-1 h-3 flex items-center cursor-pointer group/vol"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget as HTMLElement;

                  const update = (clientX: number) => {
                    const rect = target.getBoundingClientRect();
                    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / (rect.width || 1)));
                    dispatchCommand("volume", { volume: pos * 100 });
                  };

                  update(e.clientX);

                  const onMouseMove = (moveEvent: MouseEvent) => {
                    update(moveEvent.clientX);
                  };

                  const onMouseUp = () => {
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                  };

                  document.addEventListener("mousemove", onMouseMove);
                  document.addEventListener("mouseup", onMouseUp);
                }}
              >
                <div className="w-full h-1 bg-zinc-800 rounded-full relative pointer-events-none overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-zinc-500 rounded-full transition-all duration-75"
                    style={{ width: `${audioState.volume}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </BentoCard>

      {/* ── 3. Featured Card Stack ───────────────────────────────────────────*/}
      <BentoCard
        className="
          hidden
          lg:block lg:col-span-1 lg:row-span-3 lg:col-start-4 lg:row-start-1
          p-0 overflow-visible min-h-0
        "
        title={dict.home.recent_shards}
        icon="lucide:star"
      >
        <div className="flex flex-col items-center justify-start h-full relative pt-2">
          <div className="relative w-full h-64 flex items-center justify-center">
            {spotlightArtifacts.length > 0 ? (
              spotlightArtifacts.map((item, i) => (
                <div
                  key={item.id}
                  onClick={() => setActiveSpotlight(i)}
                  className={`absolute cursor-pointer transition-all duration-500 hover:z-40 ${activeSpotlight === i
                    ? "z-30 scale-110 shadow-2xl"
                    : "z-10 opacity-80"
                    }`}
                  style={{
                    transform:
                      activeSpotlight === i
                        ? "rotate(0deg) translateX(0) translateY(0)"
                        : `rotate(${i === 0 ? -12 : i === 1 ? 5 : -10
                        }deg) translateX(${(i - 1) * 20}px) translateY(${i * 10
                        }px)`,
                  }}
                >
                  <div className="bg-white p-2 md:p-2.5 rounded-lg shadow-2xl border-2 border-zinc-800 w-40 lg:w-48 text-black">
                    {item.thumbnailImage ? (
                      <img
                        src={item.thumbnailImage}
                        alt={item.title}
                        className="w-full h-32 lg:h-40 object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-32 lg:h-40 bg-zinc-200 rounded flex items-center justify-center border border-dashed border-zinc-400">
                        <Icon
                          icon="lucide:image-off"
                          width={24}
                          className="text-zinc-400"
                        />
                      </div>
                    )}
                    <div className="mt-1.5 text-[11px] font-bold truncate">
                      {item.title}
                    </div>
                    <Badge variant="distortion" className="text-[10px] mt-1">
                      {item.category}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-xl">
                <Icon icon="lucide:layers" width={32} className="text-zinc-800 mb-2" />
                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest font-black">NO_SHARDS_INDEXED</span>
                <p className="text-[8px] font-mono text-zinc-700 uppercase mt-1">Fragmented district memory</p>
              </div>
            )}
          </div>
        </div>
      </BentoCard>

      {/* ── 4. District / Dynamic Time ──────────────────────────────────────*/}
      <BentoCard
        className="
          hidden
          lg:block lg:col-span-1 lg:row-span-3 lg:col-start-5 lg:row-start-1
          p-0 overflow-hidden relative
        "
        minimal
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[16px_16px] pointer-events-none" />
        <div className="flex flex-col h-full relative z-10 bg-linear-to-b from-transparent to-zinc-950/90">
          {/* Header */}
          <div className="flex items-center justify-between h-8 px-4 bg-zinc-950/50 border-b border-zinc-800/50 z-10 group">
            <div className="flex items-center gap-2 text-zinc-500 group-hover:text-violet-400 transition-colors">
              <Icon icon="lucide:map-pin" width={10} height={10} />
              <span className="text-[11px] font-mono tracking-[0.2em] uppercase font-black">
                {dict.home.district}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
              <div className="w-1.5 h-1.5 bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-wider">
                {dict.home.signal_stable}
              </span>
            </div>
          </div>

          {/* Clock */}
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="text-4xl lg:text-5xl font-black tracking-tighter text-white font-mono drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-2">
              {time || "00:00"}
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-violet-600/10 text-violet-400 border border-violet-500/30 rounded">
              <Icon icon="lucide:clock" width={10} />
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold">
                {parseInt(time?.split(":")[0] || "12") < 5
                  ? "GHOST_HOUR // PHASE_04"
                  : parseInt(time?.split(":")[0] || "12") < 12
                    ? "MORNING_FLUX // PHASE_01"
                    : parseInt(time?.split(":")[0] || "12") < 18
                      ? "NEON_DUSK // PHASE_02"
                      : "VOID_NIGHT // PHASE_03"}
              </span>
            </div>
            <div className="mt-3 text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em] font-black opacity-60">
              Tokyo, Shimokitazawa, JST
            </div>
          </div>

          {/* Scanner Feed */}
          <div className="mt-auto p-4 space-y-3 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-900 border-dashed">
            <div className="flex flex-col gap-2 font-mono text-[11px] text-zinc-400 uppercase">
              <div className="flex justify-between items-center group">
                <span className="group-hover:text-white transition-colors">
                  [{dict.home.scanning_freq}]
                </span>
                <span className="text-zinc-500">0x{randomFreq}</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-zinc-300">SHIMO_VALVE_82</span>
                <span className="text-violet-500 flex items-center gap-1.5 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20">
                  <div className="w-1 h-1 rounded-full bg-violet-500 animate-ping" />
                  {dict.home.active}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="group-hover:text-white transition-colors">
                  [{dict.home.data_resonance}]
                </span>
                <span className="text-emerald-500">74.2%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-900/80">
              <div className="flex items-center justify-center gap-2 bg-zinc-900/50 py-2.5 rounded border border-zinc-800 hover:border-rose-500/50 hover:bg-zinc-800/80 transition-colors group">
                <Icon
                  icon="lucide:thermometer"
                  width={14}
                  className="text-rose-500 group-hover:scale-110 group-hover:-rotate-6 transition-transform"
                />
                <span className="text-[11px] font-bold text-white tracking-wider font-mono">
                  {weatherTemp}
                </span>
              </div>
              <div
                className="flex items-center justify-center gap-2 bg-zinc-900/50 py-2.5 rounded border border-zinc-800 hover:border-violet-500/50 hover:bg-zinc-800/80 transition-colors group"
                title="Active Core Records"
              >
                <Icon
                  icon="lucide:database"
                  width={14}
                  className="text-violet-500 group-hover:scale-110 group-hover:rotate-6 transition-transform"
                />
                <span className="text-[11px] font-bold text-white tracking-wider font-mono">
                  {totalResonance}
                </span>
              </div>
            </div>
          </div>
        </div>
      </BentoCard>

      {/* ── 5. In The Pit (Featured Item) ───────────────────────────────────*/}
      <div className="
        col-span-1
        sm:hidden
        lg:block lg:col-span-1 lg:row-span-2 lg:col-start-1 lg:row-start-4
      ">
        <BentoCard
          className="h-full"
          title={dict.home.in_the_pit}
          icon="lucide:flame"
        >
          {featuredArtifact ? (
            <Link
              href={`/artifacts/${featuredArtifact.category}/${featuredArtifact.id}`}
              className="flex flex-col h-full group/pit relative overflow-hidden"
            >
              <div className="relative flex-1 rounded-lg overflow-hidden mb-2 bg-zinc-950 border border-zinc-800 shadow-inner group-hover/pit:border-rose-500/50 transition-all duration-500">
                {((featuredArtifact.category === "anime" ? featuredArtifact.thumbnailImage : featuredArtifact.posterImage) || featuredArtifact.thumbnailImage || featuredArtifact.posterImage) ? (
                  <>
                    <img
                      src={
                        (featuredArtifact.category === "anime"
                          ? featuredArtifact.thumbnailImage || featuredArtifact.posterImage
                          : featuredArtifact.posterImage || featuredArtifact.thumbnailImage) || ""
                      }
                      className="object-cover w-full h-full transition-all duration-1000 group-hover/pit:scale-110 blur-sm group-hover/pit:blur-0 opacity-40 group-hover/pit:opacity-80"
                      alt={featuredArtifact.title}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img
                        src={
                          (featuredArtifact.category === "anime"
                            ? featuredArtifact.thumbnailImage || featuredArtifact.posterImage
                            : featuredArtifact.posterImage || featuredArtifact.thumbnailImage) || ""
                        }
                        className="object-contain w-3/4 h-3/4 transition-all duration-700 group-hover/pit:scale-105 shadow-2xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                        alt={featuredArtifact.title}
                      />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-900 bg-zinc-900/40">
                    <Icon icon="lucide:image-off" width={32} />
                    <span className="text-[10px] font-mono mt-1 tracking-widest uppercase opacity-40 font-black">
                      NO_VISUAL_RESONANCE
                    </span>
                  </div>
                )}
                
                {/* HUD Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-transparent to-transparent opacity-60 pointer-events-none" />
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end z-10 pointer-events-none">
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-black text-rose-500 uppercase tracking-tighter italic bg-rose-500/10 px-1.5 py-0.5 border-l border-rose-500 rounded-sm">
                      IN_THE_PIT
                    </div>
                    <div className="text-[8px] font-mono text-zinc-400 uppercase tracking-[0.2em] font-bold">
                      Res::{Number(featuredArtifact.resonance || 0.96).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-xs font-black uppercase truncate group-hover/pit:text-rose-500 transition-colors tracking-tight italic">
                {featuredArtifact.title}
              </h3>
              <p className="text-[10px] font-bold text-zinc-500 line-clamp-1 italic">
                {featuredArtifact.description}
              </p>
            </Link>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-8 opacity-20">
              <Icon icon="lucide:flame-off" width={32} className="mb-2" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Cold_Pit</span>
              <p className="text-[8px] font-mono uppercase mt-1">Zero resonance detected</p>
            </div>
          )}
        </BentoCard>
      </div>

      {/* ── 6. District Residents List ──────────────────────────────────────*/}
      <BentoCard
        className="
          col-span-1
          sm:hidden
          lg:block lg:col-span-1 lg:row-span-2 lg:col-start-2 lg:row-start-4
          overflow-hidden
        "
        contentClassName="lg:p-3"
        title={dict.home.district_entities}
        icon="lucide:user-check"
        headerAction={
          <Link
            href="/artists"
            className="text-[9px] font-mono font-bold text-zinc-500 hover:text-violet-400 uppercase tracking-widest transition-colors flex items-center gap-1 group/reg"
          >
            View Registry
            <Icon
              icon="lucide:arrow-right"
              width={9}
              className="group-hover/reg:translate-x-0.5 transition-transform"
            />
          </Link>
        }
      >
        <div className="flex flex-col gap-2.5">
          {entities.filter((entity) => entity.civilStatus === 'resident').length > 0 ? (
            entities
              .filter((entity) => entity.civilStatus === 'resident')
              .slice(0, 2)
              .map((entity) => (
                <Link
                  key={entity.id}
                  href={getEntityUrl({ type: entity._rawType, slug: entity.slug })}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-violet-500/50 hover:bg-violet-500/10 transition-all group/item shadow-sm"
                >
                  <div className="w-14 h-14 shrink-0 relative bg-zinc-950 rounded border border-zinc-700 shadow-inner overflow-hidden flex items-center justify-center text-zinc-600">
                    {entity.avatar ? (
                      <img
                        src={entity.avatar}
                        className="w-full h-full object-cover"
                        alt={entity.name}
                      />
                    ) : (
                      <Icon icon="lucide:user" width={24} />
                    )}
                    <div className="absolute top-0 right-0 bg-emerald-500 w-1.5 h-1.5 rounded-bl border-b border-l border-zinc-800 z-10 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-black text-white uppercase italic tracking-tight group-hover/item:text-violet-400 truncate leading-none mb-1">
                      {entity.name}
                    </div>
                    <div className="text-[10px] font-mono text-violet-500/80 font-bold uppercase truncate leading-none">
                      {entity.type.split("_").join(" ")}
                    </div>
                  </div>
                </Link>
              ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 opacity-20">
              <Icon icon="lucide:users" width={32} className="mb-2" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Ghost_District</span>
            </div>
          )}
        </div>
      </BentoCard>

      {/* ── 7. Featured Archives ────────────────────────────────────────────*/}
      <BentoCard
        className="
          col-span-2
          sm:hidden
          lg:block lg:col-span-1 lg:row-span-2 lg:col-start-3 lg:row-start-4
        "
        title="Featured Archives"
        icon="lucide:disc"
        contentClassName="p-2 sm:p-2.5"
      >
        <div className="grid grid-cols-[0.8fr_1.2fr] grid-rows-2 gap-1.5 h-[160px] lg:h-auto lg:flex-1 lg:min-h-0">
          {archiveArtifacts.length > 0 ? (
            (() => {
              // 1. Find the best vertical candidate (Anime or Game) for the left slot
              const verticalCandidate = archiveArtifacts.find(
                (a) => a.category === "anime" || a.category === "game"
              );
              
              // 2. Find the best horizontal candidates (All other types) for the right slots
              // This prevents vertical posters (Game/Anime) from being cropped in horizontal slots
              const horizontalCandidates = archiveArtifacts
                .filter((a) => 
                  a.id !== verticalCandidate?.id && 
                  a.category !== "anime" && 
                  a.category !== "game"
                )
                .slice(0, 2);

              // 3. Absolute fallbacks if we don't have enough diversely categorized assets
              const finalOtherArtifacts = horizontalCandidates.length > 0 
                ? horizontalCandidates 
                : archiveArtifacts.filter(a => a.id !== verticalCandidate?.id).slice(0, 2);

              return (
                <>
                  {verticalCandidate && (
                    <Link
                      href={`/artifacts/${verticalCandidate.category}/${verticalCandidate.id}`}
                      className="relative group/item rounded-lg overflow-hidden border border-zinc-900 bg-zinc-950 row-span-2"
                    >
                      {verticalCandidate.posterImage || verticalCandidate.thumbnailImage ? (
                        <img
                          src={
                            verticalCandidate.posterImage ||
                            verticalCandidate.thumbnailImage ||
                            ""
                          }
                          className="w-full h-full object-cover transition-all duration-500"
                          alt={verticalCandidate.title}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-800">
                          <Icon icon="lucide:disc" width={32} />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-zinc-950/80 backdrop-blur-md sm:translate-y-full sm:group-hover/item:translate-y-0 transition-transform">
                        <div className="text-[9px] font-black text-white uppercase truncate">
                          {verticalCandidate.title}
                        </div>
                        <div className="text-[8px] font-mono text-violet-400 uppercase mt-0.5 tracking-widest">
                          {verticalCandidate.category}
                        </div>
                      </div>
                    </Link>
                  )}
                  {finalOtherArtifacts.map((artifact: any) => (
                    <Link
                      key={artifact.id}
                      href={`/artifacts/${artifact.category}/${artifact.id}`}
                      className="relative group/item rounded-lg overflow-hidden border border-zinc-900 bg-zinc-950"
                    >
                      {artifact.thumbnailImage ? (
                        <img
                          src={artifact.thumbnailImage}
                          className="w-full h-full object-cover transition-all duration-500"
                          alt={artifact.title}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-800">
                          <Icon icon="lucide:music" width={24} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-violet-600/20 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/80 backdrop-blur-md sm:translate-y-full sm:group-hover/item:translate-y-0 transition-transform">
                        <div className="text-[8px] font-black text-white uppercase truncate px-0.5">
                          {artifact.title}
                        </div>
                      </div>
                    </Link>
                  ))}
                </>
              );
            })()
          ) : (
            <div className="col-span-2 row-span-2 flex items-center justify-center bg-zinc-950 rounded-lg border border-zinc-900 opacity-20">
              <Icon icon="lucide:archive" width={48} />
            </div>
          )}
        </div>
      </BentoCard>

      {/* ── 8. Video ────────────────────────────────────────────────────────*/}
      <BentoCard
        className="
          col-span-2 min-h-[220px]
          sm:hidden
          lg:block lg:col-span-2 lg:row-span-4 lg:col-start-4 lg:row-start-4
          overflow-hidden p-0 bg-black
        "
        minimal
      >
        <div className="w-full h-full aspect-video sm:aspect-auto">
          {videoArtifact?.videoUrl ? (
            <iframe
              src={videoArtifact.videoUrl}
              className="w-full h-full border-0 pointer-events-auto"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800 bg-zinc-950">
              <Icon icon="lucide:video-off" width={48} className="opacity-50" />
              <span className="text-[12px] font-mono mt-2 tracking-widest">
                NO_VIDEO_SIGNAL
              </span>
            </div>
          )}
        </div>
      </BentoCard>

      {/* ── 9a. YouTube Video — tablet only ─────────────────────────────────*/}
      <BentoCard
        className="
          hidden
          sm:block sm:col-span-3 sm:row-span-1 sm:col-start-1 sm:row-start-2
          lg:hidden
          overflow-hidden p-0 bg-black
        "
        minimal
      >
        <div className="w-full h-full">
          {videoArtifact?.videoUrl ? (
            <iframe
              src={videoArtifact.videoUrl}
              className="w-full h-full border-0 pointer-events-auto"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800 bg-zinc-950">
              <Icon icon="lucide:video-off" width={40} className="opacity-50" />
              <span className="text-[11px] font-mono mt-2 tracking-widest">
                NO_VIDEO_SIGNAL
              </span>
            </div>
          )}
        </div>
      </BentoCard>

      {/* ── 9b. Signal Station ───────────────────────────────────────────────*/}
      <BentoCard
        className="
          col-span-2
          sm:hidden
          lg:block lg:col-span-3 lg:row-span-2 lg:col-start-1 lg:row-start-6
          overflow-hidden p-0 bg-white
        "
        title="Signal Station"
        icon="lucide:radio"
        minimal
      >
        <div className="relative h-full flex flex-col bg-white">
          <div className="absolute inset-0 pointer-events-none z-40 opacity-[0.06] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,1)_2px,rgba(0,0,0,1)_3px)]" />

          <div className="relative p-2.5 flex items-center justify-between z-30 border-b-2 border-zinc-900 bg-white/95 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="bg-zinc-900 text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-tighter italic">
                Signal.
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-900 uppercase leading-none">
                  Transmission Log
                </span>
                <span className="text-[7px] font-mono text-zinc-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                  104.2 FM // {time.slice(0, 5)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-[7px] font-mono text-zinc-500 font-bold uppercase tracking-widest opacity-60">
                  District Pulse
                </span>
                <span className="text-[8px] font-black text-zinc-900 uppercase">
                  Operational
                </span>
              </div>
              <a
                href="https://signal.shimokitan.live"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-[0.2em] italic hover:bg-rose-600 transition-all shadow-[2px_2px_0px_rgba(225,29,72,1)] whitespace-nowrap"
              >
                Access Hub ↗
              </a>
            </div>
          </div>

          <div className="relative flex-1 overflow-hidden">
            {transmissions.length > 0 ? (
              transmissions.map((issue, idx) => (
                <div
                  key={issue.id}
                  className={cn(
                    "absolute inset-0 p-3 transition-all duration-1000 flex flex-col justify-center",
                    idx === activeSignal
                      ? "opacity-100 scale-100 z-20"
                      : "opacity-0 scale-95 z-10"
                  )}
                >
                  <div className="max-w-3xl mx-auto w-full space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400 text-[9px] font-mono font-bold tracking-tight">
                          REF_LOG::{issue.id}
                        </span>
                        {issue.type === "issue" && (
                          <span
                            className={cn(
                              "text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full border",
                              issue.severity === "critical"
                                ? "border-red-600 text-red-600 bg-red-50/50"
                                : issue.severity === "high"
                                  ? "border-amber-600 text-amber-600 bg-amber-50/50"
                                  : "border-blue-600 text-blue-600 bg-blue-50/50"
                            )}
                          >
                            {issue.severity}
                          </span>
                        )}
                        {issue.type === "editorial" && (
                          <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full border border-violet-600 text-violet-600 bg-violet-50/50">
                            Editorial
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl lg:text-2xl font-black text-zinc-900 leading-[0.9] tracking-tighter uppercase italic drop-shadow-sm">
                        {issue.title}
                      </h3>
                    </div>

                    <div className="flex gap-4 items-start">
                      {issue.attachmentUrl && (
                        <div className="w-24 h-24 lg:w-32 lg:h-32 shrink-0 relative bg-zinc-100 border-2 border-zinc-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden">
                          <img
                            src={issue.attachmentUrl}
                            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                            alt={issue.title}
                          />
                        </div>
                      )}
                      <p className="text-[12px] text-zinc-800 leading-tight font-bold max-w-2xl border-l-2 border-zinc-900 pl-2 italic line-clamp-4">
                        &ldquo;{issue.content}&rdquo;
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-900/10">
                      <div className="flex flex-col">
                        <span className="text-[7px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
                          {issue.type === "editorial" ? "Published On" : "Logged On"}
                        </span>
                        <time className="text-[9px] font-black text-zinc-900 uppercase">
                          {issue.publishedAt
                            ? new Date(issue.publishedAt)
                              .toLocaleDateString()
                              .replace(/\//g, ".")
                            : "NO_DATE"}{" "}
                          // {time.slice(0, 5)}
                        </time>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {transmissions.map((_, dotIdx) => (
                          <button
                            key={dotIdx}
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveSignal(dotIdx);
                            }}
                            className={cn(
                              "h-2 border border-zinc-900 transition-all duration-300",
                              dotIdx === activeSignal
                                ? "w-6 bg-zinc-900"
                                : "w-2 bg-transparent hover:bg-zinc-100"
                            )}
                            aria-label={`Go to transmission ${dotIdx + 1}`}
                          />
                        ))}
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-[7px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
                          Topic
                        </span>
                        <span className="text-[9px] font-black text-zinc-900 uppercase tracking-tighter">
                          {issue.topic || "District // General"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-zinc-400">
                <Icon icon="lucide:radio-off" width={32} className="mb-2 opacity-50" />
                <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em]">WAITING_FOR_BROADCAST</span>
                <p className="text-[8px] font-mono text-zinc-400 uppercase mt-1 opacity-60 italic">System is listening for incoming Signals...</p>
              </div>
            )}
          </div>

          <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        </div>
      </BentoCard>
    </div>
  );
}
