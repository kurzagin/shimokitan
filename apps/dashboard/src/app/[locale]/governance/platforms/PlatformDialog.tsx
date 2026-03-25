
'use client';

import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@shimokitan/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import PlatformForm from './PlatformForm';
import { Icon } from '@iconify/react';
import { z } from 'zod';
import { externalPlatformSchema } from '@shimokitan/utils';

type Platform = z.infer<typeof externalPlatformSchema>;

export default function PlatformDialog({ 
    editingPlatform 
}: { 
    editingPlatform?: Platform 
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    console.log('PlatformDialog State:', { isOpen, hasEditingPlatform: !!editingPlatform, mounted });

    // Sync state with search params for editing
    useEffect(() => {
        if (mounted && editingPlatform) {
            setIsOpen(true);
        }
    }, [editingPlatform, mounted]);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open && searchParams.has('id')) {
            // Clear search params when closing edit dialog
            const params = new URLSearchParams(searchParams.toString());
            params.delete('id');
            router.push(`?${params.toString()}`);
        }
    };

    if (!mounted) return (
        <button className="bg-white/5 opacity-50 text-white px-6 py-3 rounded text-[10px] font-black uppercase italic tracking-[0.2em] flex items-center gap-2 cursor-not-allowed">
            <Icon icon="lucide:loader-2" className="animate-spin" width={14} />
            Initializing...
        </button>
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <button className="bg-white hover:bg-zinc-200 text-black px-6 py-3 rounded text-[10px] font-black uppercase italic tracking-[0.2em] transition-all flex items-center gap-2">
                    <Icon icon="lucide:plus" width={14} />
                    Deploy_Protocol
                </button>
            </DialogTrigger>
            <DialogContent 
                className="max-w-xl bg-zinc-950 border-zinc-900 outline-none shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col p-0 overflow-hidden"
            >
                <DialogHeader className="p-5 pb-2">
                    <DialogTitle className="text-lg font-black uppercase italic tracking-tighter text-white">Registry_Update_Console</DialogTitle>
                    <DialogDescription className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                        Configuration registry for network gateways.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-0">
                    <PlatformForm 
                        initialData={editingPlatform} 
                        onSuccess={() => handleOpenChange(false)} 
                        insetMode={true} 
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
