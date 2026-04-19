"use client"

import React from 'react';
import { Icon } from '@iconify/react';
import { useTime } from '../../hooks/use-time';

import Link from '../Link';
import { locales, Locale, getLocalePath, getDictionary } from '@shimokitan/utils';
import { useLocale } from '../../hooks/use-i18n';
import { usePathname } from 'next/navigation';
import {
    cn,
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@shimokitan/ui';
import { useRouter } from 'next/navigation';
import { authClient } from '@shimokitan/auth';

export function Navbar() {
    const time = useTime();
    const currentLocale = useLocale() as Locale;
    const pathname = usePathname();
    const cleanPathname = pathname?.replace(new RegExp(`^\\/(${['en', 'id', 'ja'].join('|')})(\\/|$)`), '/') || '/';
    
    const dict = getDictionary(currentLocale).navbar;
    const navDict = getDictionary(currentLocale).navigation;

    const redirectedPathname = (newLocale: string) => {
        if (!pathname) return "/";
        const segments = pathname.split("/");
        
        // Check if the first segment is a valid locale
        const isLocale = locales.includes(segments[1] as any);
        
        if (isLocale) {
            segments[1] = newLocale;
            return segments.join("/");
        }
        
        // If not a locale, it means we're in the default locale path (e.g. /artists)
        // We prepend the new locale prefix
        return `/${newLocale}${pathname === "/" ? "" : pathname}`;
    };

    const { data: session, isPending } = authClient.useSession();
    const user = session?.user;
    const router = useRouter();

    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);

    const isProd = process.env.NODE_ENV === 'production';

    const handleLogout = async () => {
        await authClient.signOut();
        router.push('/auth/signin');
        router.refresh();
    };

    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <header className="h-14 border-b border-zinc-800/80 flex items-center justify-between px-4 bg-zinc-950/40 backdrop-blur-2xl z-40 shrink-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-violet-500/50 to-transparent" />

            <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <div className="w-3 h-3 bg-violet-600 rounded-sm rotate-45 pulse-glow group-hover:bg-violet-500 transition-colors" />
                        <div className="absolute inset-0 w-3 h-3 bg-violet-400 rounded-sm rotate-45 animate-ping opacity-20" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <h1 className="font-black tracking-tighter text-lg italic uppercase group-hover:text-violet-400 transition-colors text-white">SHIMOKITAN</h1>
                        <span className="text-zinc-500 text-[10px] font-mono tracking-[0.3em] font-bold group-hover:text-zinc-400 transition-colors">V.2.0.26 // DIGITAL_DISTRICT</span>
                    </div>
                </Link>

                <div className="hidden lg:flex gap-4 items-center h-8 border-l border-zinc-800/80 pl-6">
                    <div className="flex flex-col">
                        <span className="text-zinc-400 text-[9px] font-mono uppercase">{dict.system_status}</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-emerald-500/80 text-[10px] font-mono font-bold tracking-tight uppercase">{dict.operational}</span>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-zinc-400 text-[9px] font-mono uppercase">{dict.location}</span>
                        <span className="text-zinc-300 text-[10px] font-mono font-bold tracking-tight uppercase">TyO-Dist_012</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-zinc-400 text-[9px] font-mono uppercase">{dict.time}</span>
                        <span className="text-zinc-100 text-[10px] font-mono font-bold tracking-tight uppercase">{time} JST</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Language Switcher */}
                <div className="hidden sm:flex gap-2 mr-2 border-r border-zinc-800 pr-4 h-6 items-center">
                    {locales.map((l) => (
                        <a
                            key={l}
                            href={redirectedPathname(l)}
                            className={cn(
                                "text-[10px] font-black tracking-widest transition-colors px-1.5 py-0.5 rounded-sm uppercase",
                                currentLocale === l
                                    ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                                    : "text-zinc-600 hover:text-zinc-300"
                            )}
                        >
                            {l}
                        </a>
                    ))}
                </div>

                <div className="hidden sm:flex items-center gap-4">
                    <Link href="/gallery" className="text-zinc-500 hover:text-rose-400 transition-colors" title={navDict.gallery}>
                        <Icon icon="lucide:image" width={18} height={18} />
                    </Link>
                    <Link href="/artifacts" className="text-zinc-500 hover:text-white transition-colors" title={navDict.artifacts}>
                        <Icon icon="lucide:disc" width={18} height={18} />
                    </Link>
                    <Link href="/artists" className="text-zinc-500 hover:text-white transition-colors" title={navDict.artists}>
                        <Icon icon="lucide:users" width={18} height={18} />
                    </Link>

                    <div className="h-4 w-px bg-zinc-800 mx-1" />

                    <Link href="/about" className="text-zinc-500 hover:text-white transition-colors" title={navDict.about}>
                        <Icon icon="lucide:info" width={18} height={18} />
                    </Link>

                    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-sm px-3 py-1.5 flex items-center gap-2 w-32 sm:w-48 backdrop-blur-md group focus-within:border-violet-500/50 transition-colors">
                        <Icon icon="lucide:search" width={12} height={12} className="text-zinc-500 group-focus-within:text-violet-400" />
                        <input
                            type="text"
                            placeholder={dict.search_placeholder}
                            className="bg-transparent border-none outline-none text-xs w-full placeholder-zinc-500 text-zinc-300 font-mono"
                        />
                    </div>

                    <div className="h-4 w-px bg-zinc-800 mx-2" />
                </div>

                {mounted && !isPending && !isProd && (
                    <>
                        {user ? (
                            <div className="flex items-center gap-4 animate-in fade-in duration-300">
                                <Link href="/pedalboard" className="flex items-center gap-3 group">
                                    <div className="hidden sm:flex flex-col items-end leading-none">
                                        <span className="text-white text-[10px] font-black uppercase tracking-tight group-hover:text-violet-400 transition-colors">{user.name || 'Resident'}</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-sm bg-zinc-900 border border-zinc-800 overflow-hidden group-hover:border-violet-500/50 transition-colors">
                                        {user.image ? (
                                            <img src={user.image} alt={user.name || ''} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                                <Icon icon="lucide:user" width={16} />
                                            </div>
                                        )}
                                    </div>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="hidden sm:block p-1 px-2 text-zinc-600 hover:text-rose-500 transition-colors border border-transparent hover:border-zinc-800 rounded-sm"
                                    title="Disconnect"
                                >
                                    <Icon icon="lucide:power" width={14} />
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/auth/signin"
                                className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-violet-500 transition-all shadow-lg shadow-violet-900/20"
                            >
                                <Icon icon="lucide:power" width={14} />
                                {dict.initialize_session}
                            </Link>
                        )}
                    </>
                )}

                {/* Mobile Menu Toggle */}
                <div className="flex md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <button suppressHydrationWarning className="p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 rounded border border-zinc-800">
                                <Icon icon="lucide:menu" width={20} />
                            </button>
                        </SheetTrigger>
                        <SheetContent side="right" className="bg-zinc-950/98 border-zinc-800 w-[min(90vw,380px)] backdrop-blur-2xl p-0 overflow-hidden flex flex-col">
                            {/* Decorative Top Accent */}
                            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-violet-500/50 to-transparent z-50" />
                            
                            {/* Decorative Sidebar Gradient Mask */}
                            <div className="absolute inset-y-0 left-0 w-px bg-linear-to-b from-transparent via-zinc-800/50 to-transparent" />

                            <SheetHeader className="p-6 border-b border-zinc-900/50 bg-zinc-950/50 relative shrink-0">
                                <SheetTitle className="text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-violet-600 rounded-sm rotate-45 pulse-glow" />
                                        <div className="flex flex-col leading-none">
                                            <span className="font-black tracking-tighter text-lg italic uppercase text-white">SHIMOKITAN</span>
                                            <span className="text-zinc-500 text-[10px] font-mono tracking-[0.3em] font-bold uppercase">{dict.mobile_access}</span>
                                        </div>
                                    </div>
                                </SheetTitle>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto custom-scroll overflow-x-hidden">
                                <nav className="p-4 grid gap-2">
                                    <MobileNavLink icon="lucide:radio" label={navDict.home} href="/" active={cleanPathname === "/"} onClick={() => setIsOpen(false)} />
                                    <MobileNavLink icon="lucide:image" label={navDict.gallery} href="/gallery" active={cleanPathname.startsWith("/gallery")} onClick={() => setIsOpen(false)} />
                                    <MobileNavLink icon="lucide:ghost" label={navDict.back_alley} href="/back-alley" active={cleanPathname.startsWith("/back-alley")} onClick={() => setIsOpen(false)} />
                                    <MobileNavLink icon="lucide:disc" label={navDict.artifacts} href="/artifacts" active={cleanPathname.startsWith("/artifacts")} onClick={() => setIsOpen(false)} />
                                    
                                    <div className="py-1 px-1">
                                        <div className="h-px bg-zinc-900/50 w-full" />
                                    </div>

                                    <MobileNavLink icon="lucide:users" label={navDict.artists} href="/artists" active={cleanPathname.startsWith("/artists")} onClick={() => setIsOpen(false)} />
                                    
                                    <div className="py-1 px-1">
                                        <div className="h-px bg-zinc-900/50 w-full" />
                                    </div>

                                    <MobileNavLink icon="lucide:signal" label="Signal" href="https://signal.shimokitan.live" target="_blank" rel="noopener noreferrer" active={false} onClick={() => setIsOpen(false)} />
                                </nav>

                                <div className="px-4 py-2">
                                    <div className="h-px bg-zinc-900/50 w-full" />
                                </div>

                                <nav className="p-4 grid gap-2 pt-0">
                                    <MobileNavLink icon="lucide:mail" label={navDict.contact} href="/contact" active={cleanPathname === "/contact"} onClick={() => setIsOpen(false)} />
                                    <MobileNavLink icon="lucide:info" label={navDict.about} href="/about" active={cleanPathname === "/about"} onClick={() => setIsOpen(false)} />
                                </nav>

                                <div className="p-6 space-y-8 pb-10">
                                    {/* Language Switcher */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-1 bg-zinc-700 rounded-full" />
                                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">{dict.language_protocols}</span>
                                        </div>
                                        <div className="flex gap-2 p-1 bg-zinc-900/50 border border-zinc-900 rounded-lg">
                                            {locales.map((l) => (
                                                <a
                                                    key={l}
                                                    href={redirectedPathname(l)}
                                                    className={cn(
                                                        "flex-1 text-center py-2.5 rounded border transition-all uppercase font-black tracking-[0.2em] text-[10px]",
                                                        currentLocale === l
                                                            ? "bg-violet-600/10 border-violet-500/40 text-white shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                                                            : "bg-transparent border-transparent text-zinc-600 hover:text-zinc-400"
                                                    )}
                                                >
                                                    {l}
                                                </a>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Socials / Technical Readouts */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between pb-4 border-b border-zinc-900/50">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-1 bg-zinc-700 rounded-full" />
                                                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{dict.external_uplinks}</span>
                                            </div>
                                            <div className="flex items-center gap-5">
                                                <a href="https://x.com/shimokitan_off" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors group">
                                                    <Icon icon="simple-icons:x" width={16} className="group-hover:scale-110 transition-transform" />
                                                </a>
                                                <a href="https://www.instagram.com/shimokitan.live/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors group">
                                                    <Icon icon="simple-icons:instagram" width={16} className="group-hover:scale-110 transition-transform" />
                                                </a>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-zinc-900/30 border border-zinc-900/50 rounded-lg space-y-1">
                                                <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">System Time</span>
                                                <div className="text-[10px] font-mono text-zinc-300 font-bold tracking-tight">{time} JST</div>
                                            </div>
                                            <div className="p-3 bg-zinc-900/30 border border-zinc-900/50 rounded-lg space-y-1">
                                                <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">District Region</span>
                                                <div className="text-[10px] font-mono text-emerald-500 font-bold tracking-tight">TyO-Dist_012</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* User Profile / Status Bar - Fixed at Bottom */}
                            <div className="mt-auto p-4 border-t border-zinc-900 bg-zinc-950 px-6 pb-8 shrink-0">
                                {mounted && !isProd && (
                                    <>
                                        {user ? (
                                            <div className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
                                                <Link href="/pedalboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 group">
                                                    <div className="w-10 h-10 rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900 shadow-inner group-hover:border-violet-500/50 transition-colors">
                                                        {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-zinc-950"><Icon icon="lucide:user" width={20} /></div>}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white text-[11px] font-black uppercase italic tracking-tight group-hover:text-violet-400 transition-colors">{user.name}</span>
                                                        <span className="text-emerald-500 text-[8px] font-mono font-bold tracking-[0.2em] uppercase">{dict.resident_stable}</span>
                                                    </div>
                                                </Link>
                                                <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition-all hover:border-rose-500/40">
                                                    <Icon icon="lucide:power" width={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                 <Link 
                                                    href="/auth/signin" 
                                                    onClick={() => setIsOpen(false)}
                                                    className="w-full flex items-center justify-center gap-3 py-3.5 bg-violet-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-lg hover:bg-violet-500 transition-all shadow-[0_4px_20px_rgba(124,58,237,0.2)] active:scale-[0.98]"
                                                >
                                                    <Icon icon="lucide:power" width={16} />
                                                    {dict.initialize_session}
                                                </Link>
                                                <div className="text-center">
                                                    <span className="text-[8px] font-mono text-zinc-700 uppercase tracking-[0.3em] font-bold">
                                                        © 2026 SHIMOKITAN // ALL_RIGHTS_RESERVED
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                {mounted && isProd && (
                                     <div className="text-center">
                                        <span className="text-[8px] font-mono text-zinc-700 uppercase tracking-[0.3em] font-bold">
                                            © 2026 SHIMOKITAN // ALL_RIGHTS_RESERVED
                                        </span>
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}

function MobileNavLink({ icon, label, href, active, onClick, target, rel }: { icon: string, label: string, href: string, active: boolean, onClick?: () => void, target?: string, rel?: string }) {
    const content = (
        <div
            className={cn(
                "flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-300 group relative overflow-hidden",
                active
                    ? "bg-violet-600/10 border-violet-500/40 text-white shadow-[0_0_20px_rgba(139,92,246,0.05)]"
                    : "bg-zinc-900/30 border-zinc-900/50 text-zinc-500 hover:text-white hover:border-zinc-800 hover:bg-zinc-900/50"
            )}
        >
            {active && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-violet-500" />
            )}
            
            <Icon icon={icon} width={22} className={cn("transition-colors duration-300", active ? "text-violet-400" : "group-hover:text-zinc-300")} />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] font-mono">{label}</span>
            
            {active ? (
                <div className="ml-auto flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
                </div>
            ) : (
                <Icon icon="lucide:chevron-right" width={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-zinc-700" />
            )}
        </div>
    );

    if (href.startsWith('http')) {
        return (
            <a href={href} target={target} rel={rel} onClick={onClick} className="block">
                {content}
            </a>
        );
    }

    return (
        <Link href={href} onClick={onClick} className="block">
            {content}
        </Link>
    );
}

