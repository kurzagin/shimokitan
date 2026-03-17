"use client"

import React from 'react';
import { Icon } from '@iconify/react';
import Link from './Link';
import { usePathname } from 'next/navigation';
import { cn } from '@shimokitan/ui';
import Image from 'next/image';

interface NavItem {
    label: string;
    href: string;
    icon: string;
    badge?: number;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const groups: NavGroup[] = [
    {
        title: "Core_Registry",
        items: [
            { label: "Dashboard", href: "/", icon: "lucide:layout-dashboard" },
            { label: "Works_Registry", href: "/works", icon: "lucide:library" },
            { label: "Artifacts", href: "/artifacts", icon: "lucide:package" },
            { label: "Entities", href: "/entities", icon: "lucide:users" },
        ]
    },
    {
        title: "Governance",
        items: [
            { label: "Audit_Queue", href: "/verifications", icon: "lucide:shield-check" },
            { label: "Platforms", href: "/governance/platforms", icon: "lucide:globe" },
        ]
    }
];

export default function Sidebar({ user }: { user: { name?: string | null; image?: string | null; role?: string | null } | null | undefined }) {
    const pathname = usePathname();

    const isLinkActive = (href: string) => {
        if (href === '/' && pathname === '/') return true;
        if (href !== '/' && pathname.includes(href)) return true;
        return false;
    };

    return (
        <aside className="w-64 border-r border-zinc-900 bg-black flex flex-col h-screen sticky top-0 shrink-0 overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-zinc-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-rose-600 rounded flex items-center justify-center font-black italic text-black shrink-0">S</div>
                <div className="flex flex-col">
                    <span className="text-xs font-black uppercase italic tracking-tighter text-white">Shimokitan</span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">System_Console</span>
                </div>
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 p-4 space-y-8 mt-4">
                {groups.map((group) => (
                    <div key={group.title} className="space-y-2">
                        <h4 className="px-3 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-4">{group.title}</h4>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const active = isLinkActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center justify-between group px-3 py-2.5 rounded-lg transition-all",
                                            active 
                                                ? "bg-rose-600/10 border border-rose-900/30 text-rose-500" 
                                                : "text-zinc-500 hover:text-white hover:bg-zinc-900"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon 
                                                icon={item.icon} 
                                                width={18} 
                                                className={cn("transition-colors", active ? "text-rose-500" : "text-zinc-600 group-hover:text-zinc-400")} 
                                            />
                                            <span className="text-[11px] font-black uppercase tracking-tight">{item.label}</span>
                                        </div>
                                        {item.badge ? (
                                            <span className="bg-rose-600 text-black text-[9px] px-1.5 py-0.5 rounded-full font-black">{item.badge}</span>
                                        ) : (
                                            <Icon 
                                                icon="lucide:chevron-right" 
                                                width={12} 
                                                className={cn("opacity-0 -translate-x-2 transition-all", active ? "opacity-100 translate-x-0" : "group-hover:opacity-40 group-hover:translate-x-0")} 
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-950/30">
                <div className="flex items-center gap-3 p-2 bg-black/50 border border-zinc-900 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                        {user?.image ? (
                            <Image src={user.image} alt={user.name || 'User'} width={32} height={32} className="w-full h-full object-cover" />
                        ) : (
                            <Icon icon="lucide:user" className="text-zinc-600" width={16} />
                        )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-black uppercase text-white truncate">{user?.name || "System_User"}</span>
                        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-tighter truncate">{user?.role || "Resident"}</span>
                    </div>
                    <Link href="/auth/signout" className="ml-auto text-zinc-700 hover:text-rose-500 transition-colors">
                        <Icon icon="lucide:log-out" width={14} />
                    </Link>
                </div>
            </div>
        </aside>
    );
}
