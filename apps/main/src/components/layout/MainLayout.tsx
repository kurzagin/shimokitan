"use client"

import React from 'react';
import { usePathname } from 'next/navigation';
import {
    CyberpunkShell,
    NavigationLink,
    cn
} from '@shimokitan/ui';

import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Locale, getDictionary } from '@shimokitan/utils';
import { useLocale } from '../../hooks/use-i18n';

export function MainLayout({ children, noScroll = false }: { children: React.ReactNode, noScroll?: boolean }) {
    const pathname = usePathname();
    const currentLocale = useLocale() as Locale;
    const navDict = getDictionary(currentLocale).navigation;

    // Clean pathname to remove locale prefix for accurate active state detection
    const cleanPathname = pathname?.replace(new RegExp(`^\\/(${['en', 'id', 'ja'].join('|')})(\\/|$)`), '/') || '/';

    const isHomeActive = cleanPathname === "/";
    const isCinemaActive = cleanPathname.startsWith("/cinema");
    const isArtistsActive = cleanPathname.startsWith("/artists");
    const isGalleryActive = cleanPathname.startsWith("/gallery");
    const isBackAlleyActive = cleanPathname.startsWith("/back-alley");


    return (
        <CyberpunkShell>
            <div className="bg-black text-white h-screen w-screen overflow-hidden flex flex-col font-sans selection:bg-violet-500/40 selection:text-violet-100 italic-selection">


                {/* Dynamic Background Mesh */}
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-900/10 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-900/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-900/5 rounded-full blur-[100px]" />
                </div>

                <Navbar />

                {/* --- Main Content Area --- */}
                <div className="flex-1 flex p-4 gap-6 overflow-hidden relative">
                    {/* Sidebar */}
                    <nav className="hidden md:flex flex-col gap-4 shrink-0 justify-center z-50">
                        <div className="bg-zinc-950/40 border border-zinc-800/80 p-2.5 rounded-3xl backdrop-blur-2xl flex flex-col items-center gap-3.5 shadow-2xl relative w-16">
                            <NavigationLink icon="lucide:radio" label={navDict.home} href="/" active={isHomeActive} />
                            <NavigationLink icon="lucide:image" label={navDict.gallery} href="/gallery" active={isGalleryActive} />
                            <NavigationLink icon="lucide:ghost" label={navDict.back_alley} href="/back-alley" active={isBackAlleyActive} />
                            <NavigationLink icon="lucide:disc" label={navDict.artifacts} href="/cinema" active={isCinemaActive} />
                            
                            <div className="h-px bg-zinc-800/80 w-full my-1" />

                            <NavigationLink icon="lucide:users" label={navDict.artists} href="/artists" active={isArtistsActive} />

                            <div className="h-px bg-zinc-800/80 w-full my-1" />

                            <NavigationLink icon="lucide:signal" label="Signal" href="https://signal.shimokitan.live" target="_blank" rel="noopener noreferrer" />
                        </div>
                    </nav>

                    {/* Children / Page Content */}
                    <main className={cn(
                        "flex-1 z-30 min-h-0 custom-scroll",
                        noScroll ? "overflow-hidden h-full" : "overflow-y-auto overflow-x-hidden"
                    )}>
                        {children}
                        <div className="md:hidden shrink-0 mt-6 pb-6">
                            <Footer />
                        </div>
                    </main>
                </div>

                <div className="hidden md:block">
                    <Footer />
                </div>
            </div>
        </CyberpunkShell>
    );
}
