"use client";

import React, { useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { createFullWork, updateFullWork } from '../actions/works';
import { useRouter } from 'next/navigation';
import { MediaUploader } from '@shimokitan/ui';
import { uploadMediaAction } from '../media-actions';
import { toast } from 'sonner';
import { extractMediaId, getThumbnailUrl, nanoid } from '@shimokitan/utils';
import WorkMetadataSection from './components/WorkMetadataSection';
import WorkCreditsSection from './components/WorkCreditsSection';
import AnilistSync from '../artifacts/components/AnilistSync';

export default function WorkForm({
    initialData
}: {
    initialData?: any | null /* eslint-disable-line @typescript-eslint/no-explicit-any */
}) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'en' | 'id' | 'ja'>('en');

    // Multi-Language State
    const [translations, setTranslations] = useState(
        ['en', 'id', 'ja'].map(lang => {
            const trans = initialData?.translations?.find((t: { locale: string }) => t.locale === lang);
            return {
                locale: lang as 'en' | 'id' | 'ja',
                title: trans?.title || '',
                description: trans?.description || ''
            };
        })
    );

    const [category, setCategory] = useState(initialData?.category || 'music');
    const [slug, setSlug] = useState(initialData?.slug || '');
    const [nature, setNature] = useState(initialData?.nature || 'original');
    const [status, setStatus] = useState(initialData?.status || 'back_alley');
    
    // Metadata State (Specs & Tags)
    const [specs, setSpecs] = useState<{ key: string, value: string }[]>(
        initialData?.specs ? Object.entries(initialData.specs).map(([k, v]) => ({ key: k, value: String(v) })) : []
    );
    const [tags, setTags] = useState<{ id?: string, name: string }[]>(
        initialData?.tags?.map((t: { tag: { id: string, translations?: { name: string }[] } }) => ({ id: t.tag.id, name: t.tag.translations?.[0]?.name || '' })) || []
    );

    // Credits State
    const [credits, setCredits] = useState<{ entityId: string; entityName?: string; role: string; contributorClass: 'author' | 'collaborator' | 'staff'; isPrimary: boolean; position: number }[]>(
        initialData?.credits?.map((c: { entityId: string; entity?: { translations?: { name: string }[] }; role: string; contributorClass: string; isPrimary: boolean; position: number }) => ({
            entityId: c.entityId || '',
            entityName: c.entity?.translations?.[0]?.name,
            role: c.role || '',
            contributorClass: (c.contributorClass as 'author' | 'collaborator' | 'staff') || 'staff',
            isPrimary: !!c.isPrimary,
            position: c.position || 0
        })) || []
    );

    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(initialData?.thumbnail?.url || null);
    const [thumbnailId, setThumbnailId] = useState<string | null>(initialData?.thumbnailId || null);
    const [pendingThumbnailUrl, setPendingThumbnailUrl] = useState<string | null>(null);

    const [posterUrl, setPosterUrl] = useState<string | null>(initialData?.poster?.url || null);
    const [posterId, setPosterId] = useState<string | null>(initialData?.posterId || null);
    const [pendingPosterUrl, setPendingPosterUrl] = useState<string | null>(null);

    // CTRL+S save handler
    const handleSave = useCallback(async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        const t = toast.loading(`${initialData?.id ? 'UPDATING_IP_ANCHOR' : 'PUBLISHING_IP_ANCHOR'}...`);

        try {
            let finalThumbnailId = thumbnailId;
            let finalPosterId = posterId;

            // Handle uploads if needed (thumbnail)
            if (pendingThumbnailUrl) {
                const formData = new FormData();
                formData.append('url', pendingThumbnailUrl);
                formData.append('context', 'work_asset');
                const res = await uploadMediaAction(formData);
                finalThumbnailId = res.mediaId;
            }

            // Handle uploads if needed (poster)
            if (pendingPosterUrl) {
                const formData = new FormData();
                formData.append('url', pendingPosterUrl);
                formData.append('context', 'work_asset');
                const res = await uploadMediaAction(formData);
                finalPosterId = res.mediaId;
            }

            // Convert specs back to object
            const specsObj = specs.reduce((acc, curr) => {
                if (curr.key) acc[curr.key] = curr.value;
                return acc;
            }, {} as Record<string, any>);

            const payload = {
                category,
                nature,
                status,
                slug: slug || null,
                translations: translations.filter(t => t.title.trim() !== ''),
                thumbnailId: finalThumbnailId,
                posterId: finalPosterId,
                specs: specsObj,
                tags: tags.filter(tag => tag.name.trim() !== ''),
                credits: credits.filter(c => c.entityId !== '')
            };

            if (initialData?.id) {
                await updateFullWork(initialData.id, payload as any);
                toast.success('IP Anchor Record Updated successfully', { id: t });
            } else {
                await createFullWork(payload as any);
                toast.success('New IP Anchor Record Published', { id: t });
            }

            router.refresh();
            router.push('/works');
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || 'Transmission_Failure: Signal lost during commit', { id: t });
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, initialData?.id, category, nature, status, slug, translations, thumbnailId, posterId, pendingThumbnailUrl, pendingPosterUrl, specs, tags, credits, router]);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    const updateTrans = (locale: string, field: 'title' | 'description', value: string) => {
        setTranslations(translations.map(t => t.locale === locale ? { ...t, [field]: value } : t));
    };

    const handleThumbnailUrlSelect = (url: string) => {
        let targetUrl = url;
        if (url.includes('youtube.com/') || url.includes('youtu.be/')) {
            const id = extractMediaId(url, 'youtube');
            const thumb = getThumbnailUrl(id, 'youtube');
            if (thumb) targetUrl = thumb;
        }
        setThumbnailUrl(targetUrl);
        setPendingThumbnailUrl(targetUrl);
    };

    const handleExternalPoster = (url: string) => {
        setPosterUrl(url);
        setPendingPosterUrl(url);
        setPosterId(null);
    };

    const handleAnilistSync = useCallback((data: any) => {
        if (!data) return;

        setCategory('anime');

        // Sync Titles
        setTranslations(prev => prev.map(t => {
            if (t.locale === 'en') return { ...t, title: data.title.english || data.title.romaji };
            if (t.locale === 'ja') return { ...t, title: data.title.native };
            return t;
        }));

        // Sync Metadata (Specs)
        const currentSpecs = [...specs];
        const anilistSpecs = [
            { key: 'anilist_id', value: String(data.id) },
            { key: 'format', value: data.format },
            { key: 'season', value: `${data.season} ${data.seasonYear}` },
            { key: 'episodes', value: String(data.episodes) },
            { key: 'status', value: data.status }
        ];

        // Merge or replace
        const mergedSpecs = [...anilistSpecs];
        currentSpecs.forEach(s => {
            if (!mergedSpecs.find(as => as.key === s.key)) {
                mergedSpecs.push(s);
            }
        });
        setSpecs(mergedSpecs);

        // Sync Tags (Genres)
        if (data.genres) {
            setTags(data.genres.map((g: string) => ({ name: g })));
        }

        // Sync Image
        if (data.coverImage?.extraLarge) {
            handleExternalPoster(data.coverImage.extraLarge);
            if (!thumbnailUrl) {
                setThumbnailUrl(data.coverImage.extraLarge);
                setPendingThumbnailUrl(data.coverImage.extraLarge);
            }
        }

        toast.success(`Synced metadata for: ${data.title.english || data.title.romaji}`);
    }, [specs, thumbnailUrl]);

    // Metadata Handlers
    const addSpec = () => setSpecs([...specs, { key: '', value: '' }]);
    const updateSpec = (i: number, f: 'key' | 'value', v: string) => {
        const n = [...specs];
        n[i][f] = v;
        setSpecs(n);
    };
    const upsertSpec = (k: string, v: string) => {
        const existing = specs.findIndex(s => s.key === k);
        if (existing >= 0) updateSpec(existing, 'value', v);
        else setSpecs([...specs, { key: k, value: v }]);
    };
    const removeSpec = (i: number) => setSpecs(specs.filter((_, idx) => idx !== i));

    const addTag = () => setTags([...tags, { name: '' }]);
    const updateTag = (i: number, f: 'name', v: string) => {
        const n = [...tags];
        n[i][f] = v;
        setTags(n);
    };
    const removeTag = (i: number) => setTags(tags.filter((_, idx) => idx !== i));

    return (
        <div className="relative pb-24">
            <div className="space-y-16">
                {category === 'anime' && !initialData?.id && (
                    <div className="animate-in fade-in slide-in-from-top-4">
                        <AnilistSync onSync={handleAnilistSync} />
                    </div>
                )}
                <div className="space-y-12">
                    {/* 01. CORE_SYSTEM_IDENTIFIER */}
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-6">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">01 {'//'} CORE_SYSTEM_IDENTIFIER</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                        {/* 01.A IDENTITY_AUTHORITY_STACK */}
                        <div className="lg:col-span-4 space-y-10">
                            {/* Identity Module */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-4">
                                    <Icon icon="lucide:fingerprint" className="text-zinc-500" width={14} />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic font-mono">Identity_Module</h3>
                                </div>
                                <div className="space-y-5">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono uppercase text-zinc-500 pl-1">Category_Sector</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value as any)}
                                            required
                                            className="w-full bg-black border border-zinc-900 p-3 text-xs text-white focus:border-rose-600 outline-none transition-all rounded-lg appearance-none cursor-pointer font-bold"
                                        >
                                            <option value="music">MUSIC_TRACK</option>
                                            <option value="anime">ANIME_FEATURE</option>
                                            <option value="game">GAME_ENTITY</option>
                                            <option value="other">OTHER_SIGNAL</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono uppercase text-zinc-500 pl-1">Handle_Reference</label>
                                        <div className="flex items-center gap-2 bg-black border border-zinc-900 focus-within:border-rose-600 outline-none transition-all rounded-lg pl-3 pr-1 backdrop-blur-sm">
                                            <span className="text-[10px] font-mono text-zinc-600">/</span>
                                            <input
                                                value={slug}
                                                onChange={(e) => setSlug(e.target.value)}
                                                className="w-full bg-transparent border-none p-3 pl-0 text-xs text-white outline-none font-mono"
                                                placeholder="work-slug-here..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setSlug(nanoid())}
                                                className="p-1 px-2 hover:bg-zinc-900 rounded-md transition-all group/gen"
                                                title="Generate Random Handle"
                                            >
                                                <Icon icon="lucide:refresh-cw" className="text-zinc-600 group-hover/gen:text-rose-500 transition-colors" width={14} />
                                            </button>
                                        </div>
                                        <p className="text-[8px] text-zinc-600 font-mono italic pl-2">System: {initialData?.slug || 'PENDING'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Authority Module */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-4">
                                    <Icon icon="lucide:shield-check" className="text-emerald-500" width={14} />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic font-mono">Authority_Module</h3>
                                </div>
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono uppercase text-zinc-500 pl-1">Nature</label>
                                            <select
                                                value={nature}
                                                onChange={(e) => setNature(e.target.value as any)}
                                                className="w-full bg-black border border-zinc-900 p-3 text-xs text-white focus:border-violet-600 outline-none transition-all rounded-lg appearance-none cursor-pointer font-bold"
                                            >
                                                <option value="original">ORIGINAL</option>
                                                <option value="cover">COVER</option>
                                                <option value="live">LIVE</option>
                                                <option value="compilation">EP/OST</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono uppercase text-zinc-500 pl-1">Status</label>
                                            <select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value as any)}
                                                className="w-full bg-black border border-zinc-900 p-3 text-xs text-white focus:border-emerald-600 outline-none transition-all rounded-lg appearance-none cursor-pointer font-bold"
                                            >
                                                <option value="back_alley">ACTIVE</option>
                                                <option value="the_pit">PIT</option>
                                                <option value="archived">ARCHIVE</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono uppercase text-zinc-500 pl-1">Authority_Domain</label>
                                        <input
                                            value={specs.find(s => s.key === 'registry_domain')?.value || ''}
                                            onChange={(e) => upsertSpec('registry_domain', e.target.value)}
                                            placeholder="e.g. shimokitan.com"
                                            className="w-full bg-black border border-zinc-900 p-3 text-xs text-white focus:border-sky-600 outline-none transition-all rounded-lg font-mono font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 01.B BRANDING_ORCHESTRATOR */}
                        <div className="lg:col-span-8 space-y-4">
                            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-4">
                                <Icon icon="lucide:layout-template" className="text-zinc-500" width={14} />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic font-mono">Branding_Module</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                {/* Portrait Identity */}
                                <div className="md:col-span-2 space-y-3">
                                    <div className="flex flex-col pl-1">
                                        <span className="text-[10px] font-mono uppercase text-zinc-400">Portrait_Identity</span>
                                        <span className="text-[8px] font-mono text-zinc-600 uppercase">Aspect: 3:4 / 2:3</span>
                                    </div>
                                    <div className="aspect-[3/4] bg-zinc-950/50 border border-zinc-900 rounded-xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                                        <MediaUploader
                                            value={posterUrl || ''}
                                            uploadAction={uploadMediaAction}
                                            onChange={(id, url) => { setPosterId(id); setPosterUrl(url); }}
                                            contextType="work_asset"
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>

                                {/* Landscape Hero */}
                                <div className="md:col-span-3 space-y-3">
                                    <div className="flex flex-col pl-1">
                                        <span className="text-[10px] font-mono uppercase text-zinc-400">Landscape_Hero</span>
                                        <span className="text-[8px] font-mono text-zinc-600 uppercase">Aspect: 16:9 / 21:9</span>
                                    </div>
                                    <div className="aspect-video bg-zinc-950/50 border border-zinc-900 rounded-xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
                                        <MediaUploader
                                            value={thumbnailUrl || ''}
                                            uploadAction={uploadMediaAction}
                                            onChange={(id, url) => { setThumbnailId(id); setThumbnailUrl(url); }}
                                            onUrlSelect={handleThumbnailUrlSelect}
                                            contextType="work_asset"
                                            className="w-full h-full"
                                        />
                                    </div>
                                    
                                    {/* Asset Legend / Info */}
                                    <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-zinc-950/30 border border-zinc-900/50 rounded-lg">
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-mono text-zinc-500 uppercase block">Poster_Resolution</span>
                                            <span className="text-[10px] font-bold text-zinc-400">AUTO_SCALE</span>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <span className="text-[8px] font-mono text-zinc-500 uppercase block">Storage_Protocol</span>
                                            <span className="text-[10px] font-bold text-zinc-400 italic">R2_SECURE</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 02. LOCALIZATION MATRIX */}
                    <div className="w-full pt-8 border-t border-zinc-900">
                        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-6">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">02 {'//'} LOCALIZATION_MATRIX</span>
                        </div>
                        <div className="flex flex-col bg-zinc-950/20 p-8 border border-zinc-900 rounded-xl backdrop-blur-md">
                            <div className="flex items-center justify-between mb-8 border-b border-zinc-900/50 pb-6">
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 italic">I18n_Localization_Matrix</h3>
                                    <p className="text-[9px] text-zinc-600 font-mono italic uppercase">Multilingual_Synchronization.</p>
                                </div>
                                <div className="flex gap-1 bg-black p-1 rounded-lg border border-zinc-900">
                                    {translations.map(t => (
                                        <button
                                            key={t.locale}
                                            type="button"
                                            onClick={() => setActiveTab(t.locale)}
                                            className={`px-6 py-2 text-[10px] font-black uppercase transition-all rounded-md ${activeTab === t.locale ? 'bg-amber-600 text-black' : 'text-zinc-500 hover:text-white'}`}
                                        >
                                            {t.locale}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {translations.map(t => (
                                <div key={t.locale} className={activeTab === t.locale ? 'space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-mono uppercase text-zinc-500 pl-1 tracking-widest">Public_Title ({t.locale})</label>
                                        <input
                                            value={t.title}
                                            onChange={(e) => updateTrans(t.locale, 'title', e.target.value)}
                                            className="w-full bg-black border border-zinc-800 p-4 text-sm text-white focus:border-amber-600 outline-none transition-all rounded-lg font-bold italic"
                                            placeholder={`Work Title in ${t.locale.toUpperCase()}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-mono uppercase text-zinc-500 pl-1 tracking-widest">IP_Context ({t.locale})</label>
                                        <textarea
                                            value={t.description}
                                            onChange={(e) => updateTrans(t.locale, 'description', e.target.value)}
                                            rows={8}
                                            className="w-full bg-black border border-zinc-800 p-4 text-sm text-white focus:border-amber-600 outline-none transition-all rounded-lg resize-none leading-relaxed"
                                            placeholder="System description / IP background / chronological context..."
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 03. CANON_METADATA */}
                    <WorkMetadataSection
                        category={category}
                        specs={specs}
                        updateSpec={updateSpec}
                        upsertSpec={upsertSpec}
                        addSpec={addSpec}
                        removeSpec={removeSpec}
                        tags={tags}
                        updateTag={updateTag}
                        addTag={addTag}
                        removeTag={removeTag}
                    />

                    {/* 04. CANON_CONTRIBUTORS */}
                    <WorkCreditsSection
                        credits={credits}
                        setCredits={setCredits}
                    />
                </div>
            </div>

            {/* Sticky Save Bar */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-black/90 backdrop-blur-2xl border-t border-zinc-900 p-4 z-50 animate-in slide-in-from-bottom-full duration-500">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
                    <div className="hidden md:flex items-center gap-6 text-zinc-500 font-mono">
                        <div className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px]">ESC</kbd>
                            <span className="text-[9px] uppercase font-bold">Discard</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px]">^ S</kbd>
                            <span className="text-[9px] uppercase font-bold">Commit_Changes</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 md:flex-none px-8 py-3 bg-zinc-950 border border-zinc-800 text-zinc-500 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-900 hover:text-white transition-all rounded-lg"
                        >
                            CANCEL_SIGNAL
                        </button>
                        <button
                            onClick={() => handleSave()}
                            disabled={isSubmitting}
                            type="button"
                            className="flex-1 md:flex-none px-12 py-3 bg-rose-600 text-black font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 transition-all disabled:opacity-50 rounded-lg shadow-[0_0_40px_rgba(225,29,72,0.15)]"
                        >
                            {isSubmitting ? 'COMMITTING_IP_ANCHOR...' : initialData?.id ? 'UPGRADE_ANCHOR' : 'PUBLISH_ANCHOR'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

