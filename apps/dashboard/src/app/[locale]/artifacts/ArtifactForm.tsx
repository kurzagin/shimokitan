
"use client"

import React, { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { extractMediaId, getThumbnailUrl, nanoid, artifactSchema } from '@shimokitan/utils';
import { createFullArtifact, updateFullArtifact } from '../actions/artifacts';
import { uploadMediaAction } from '../media-actions';
import { toast } from 'sonner';
import { z, type ZodIssue } from 'zod';


import { Icon } from '@iconify/react';
import AnilistSync from './components/AnilistSync';
import BasicInfoSection from './components/BasicInfoSection';
import ResourcesSection, { Resource } from './components/ResourcesSection';
import ExhibitsSection, { Exhibit } from './components/ExhibitsSection';
import MetadataSection from './components/MetadataSection';
import CreditsSection from './components/CreditsSection';
import EntitySearchPicker from './components/EntitySearchPicker';

type Entity = {
    id: string;
    name: string;
    type: string;
};

type Credit = {
    entityId: string;
    role: string;
    displayRole?: string;
    contributorClass: 'author' | 'collaborator' | 'staff';
    isPrimary: boolean;
    isOriginalArtist: boolean;
    position: number;
};

type Spec = {
    key: string;
    value: string;
};

export interface Platform {
    id: string;
    name: string;
    category: string;
}

export default function ArtifactForm({
    entities,
    initialData,
    onComplete,
    userRole,
    verificationId,
    initialArchival,
    platforms = []
}: {
    entities: Entity[],
    initialData?: any,
    onComplete?: () => void,
    userRole?: string,
    verificationId?: string,
    initialArchival?: boolean,
    platforms?: Platform[]
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const anilistId = searchParams.get('anilist_id');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'en' | 'id' | 'ja'>('en');

    React.useEffect(() => {
        const handleKeyDown = (e: React.KeyboardEvent | KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                const form = document.querySelector('form');
                if (form) form.requestSubmit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // --- Derived helpers for initial assets ---
    const getInitialMediaId = (role: string) => {
        return initialData?.media?.find((m: any) => m.role === role)?.media?.id || null;
    };
    const getInitialMediaUrl = (role: string) => {
        return initialData?.media?.find((m: any) => m.role === role)?.media?.url || '';
    };

    // --- State Management ---
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

    const [resources, setResources] = useState<Resource[]>(
        initialData?.resources
            ? initialData.resources.map((r: any) => ({ type: 'other', platform: r.platform, url: r.value, role: r.role || 'audio', isPrimary: r.isPrimary }))
            : [{ type: 'video', platform: 'youtube', url: '', role: 'video', isPrimary: false }]
    );
    const [credits, setCredits] = useState<Credit[]>(
        initialData?.credits
            ? initialData.credits.map((c: any) => ({
                entityId: c.entityId || '',
                role: c.role || '',
                displayRole: c.displayRole || '',
                contributorClass: c.contributorClass || 'staff',
                isPrimary: !!c.isPrimary,
                isOriginalArtist: !!c.isOriginalArtist,
                position: c.position || 0,
            }))
            : []
    );
    const [exhibits, setExhibits] = useState<Exhibit[]>(
        initialData?.exhibits
            ? initialData.exhibits.map((ex: any) => ({
                id: ex.id,
                type: ex.type,
                url: ex.url,
                mediaId: ex.mediaId,
                mediaUrl: ex.media?.url,
                translations: ['en', 'id', 'ja'].map(lang => {
                    const t = ex.translations?.find((t: any) => t.locale === lang);
                    return { locale: lang as any, title: t?.title || '', description: t?.description || '' };
                })
            }))
            : []
    );
    const [specs, setSpecs] = useState<Spec[]>(
        initialData?.specs
            ? Object.entries(initialData.specs).map(([key, value]) => ({ key, value: String(value) }))
            : []
    );
    const [tags, setTags] = useState<{ id?: string, name: string }[]>(
        initialData?.tags
            ? initialData.tags.map((t: { tag: { id: string; name?: string; translations?: { name: string }[] } }) => ({ 
                id: t.tag.id, 
                name: t.tag.translations?.[0]?.name || t.tag.name || 'Unknown' 
            }))
            : []
    );

    const [artifactId] = useState(initialData?.id || nanoid());
    
    // Legacy mapping to new unified bridge
    const [thumbnailId, setThumbnailId] = useState<string | null>(getInitialMediaId('thumbnail'));
    const [thumbnailUrl, setThumbnailUrl] = useState(getInitialMediaUrl('thumbnail'));
    const [pendingThumbnailFile, setPendingThumbnailFile] = useState<File | null>(null);
    const [pendingThumbnailUrl, setPendingThumbnailUrl] = useState<string | null>(null);

    const [posterId, setPosterId] = useState<string | null>(getInitialMediaId('poster'));
    const [posterUrl, setPosterUrl] = useState(getInitialMediaUrl('poster'));
    const [pendingPosterFile, setPendingPosterFile] = useState<File | null>(null);
    const [pendingPosterUrl, setPendingPosterUrl] = useState<string | null>(null);

    const [vinylId, setVinylId] = useState<string | null>(getInitialMediaId('vinyl'));
    const [vinylUrl, setVinylUrl] = useState(getInitialMediaUrl('vinyl'));
    const [pendingVinylFile, setPendingVinylFile] = useState<File | null>(null);
    const [pendingVinylUrl, setPendingVinylUrl] = useState<string | null>(null);


    const [category, setCategory] = useState(initialData?.category || (anilistId ? 'anime' : 'music'));
    const [animeType, setAnimeType] = useState(initialData?.animeType || null);

    const [workId, setWorkId] = useState<string | null>(initialData?.workId || null);
    const [workTitle, setWorkTitle] = useState<string | null>(initialData?.work?.translations?.[0]?.title || null);

    const handleExternalThumbnail = async (url: string) => {
        if (!url) return;
        setThumbnailUrl(url);
        setPendingThumbnailUrl(url);
        setPendingThumbnailFile(null);
    };

    const handleThumbnailFileSelect = (file: File, objectUrl: string) => {
        setThumbnailUrl(objectUrl);
        setPendingThumbnailFile(file);
        setPendingThumbnailUrl(null);
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
        setPendingThumbnailFile(null);
    };

    const handleExternalPoster = async (url: string) => {
        if (!url) return;
        setPosterUrl(url);
        setPendingPosterUrl(url);
        setPendingPosterFile(null);
    };

    const handlePosterFileSelect = (file: File, objectUrl: string) => {
        setPosterUrl(objectUrl);
        setPendingPosterFile(file);
        setPendingPosterUrl(null);
    };

    const handlePosterUrlSelect = (url: string) => {
        let targetUrl = url;
        if (url.includes('youtube.com/') || url.includes('youtu.be/')) {
            const id = extractMediaId(url, 'youtube');
            const thumb = getThumbnailUrl(id, 'youtube');
            if (thumb) targetUrl = thumb;
        }
        setPosterUrl(targetUrl);
        setPendingPosterUrl(targetUrl);
        setPendingPosterFile(null);
    };

    const handleVinylFileSelect = (file: File, objectUrl: string) => {
        setVinylUrl(objectUrl);
        setPendingVinylFile(file);
        setPendingVinylUrl(null);
    };

    const handleVinylUrlSelect = (url: string) => {
        let targetUrl = url;
        if (url.includes('youtube.com/') || url.includes('youtu.be/')) {
            const id = extractMediaId(url, 'youtube');
            const thumb = getThumbnailUrl(id, 'youtube');
            if (thumb) targetUrl = thumb;
        }
        setVinylUrl(targetUrl);
        setPendingVinylUrl(targetUrl);
        setPendingVinylFile(null);
    };


    const updateTrans = (locale: string, field: 'title' | 'description', value: string) => {
        setTranslations(translations.map(t => t.locale === locale ? { ...t, [field]: value } : t));
    };

    const handleAnilistSync = useCallback((data: any) => {
        if (!data) return;
        setCategory('anime');
        setTranslations(prev => prev.map(t => {
            if (t.locale === 'en') return { ...t, title: data.title.english || data.title.romaji };
            if (t.locale === 'ja') return { ...t, title: data.title.native };
            return t;
        }));
        const newSpecs: Spec[] = [
            { key: 'anilist_id', value: String(data.id) },
            { key: 'format', value: data.format },
            { key: 'season', value: `${data.season} ${data.seasonYear}` },
            { key: 'episodes', value: String(data.episodes) },
            { key: 'status', value: data.status }
        ];
        setSpecs(newSpecs);
        if (data.genres) setTags(data.genres.map((g: string) => ({ name: g })));
        if (data.coverImage?.extraLarge) {
            handleExternalPoster(data.coverImage.extraLarge);
            if (!thumbnailUrl) handleExternalThumbnail(data.coverImage.extraLarge);
        }
        toast.success(`Synced metadata for: ${data.title.english || data.title.romaji}`);
    }, [thumbnailUrl]);

    const addResource = () => setResources([...resources, { type: 'video', platform: 'youtube', url: '', role: 'video', isPrimary: false }]);
    const removeResource = (idx: number) => setResources(resources.filter((_, i) => i !== idx));
    const updateResource = (idx: number, field: keyof Resource, value: any) => {
        const newResources = [...resources];
        if (field === 'isPrimary' && value === true) newResources.forEach(r => r.isPrimary = false);
        if (field === 'url' && value) {
            let v = value.toLowerCase();
            if (v.includes('youtube.com/') || v.includes('youtu.be/')) {
                const match = value.match(/(?:v=|\/)([\w-]{11})(?:\?|&|\/|$)/);
                if (match && match[1]) value = `https://www.youtube.com/watch?v=${match[1]}`;
                newResources[idx].platform = 'youtube';
                newResources[idx].type = 'video';
                newResources[idx].role = 'video';
            } else if (v.includes('spotify.com/')) { newResources[idx].platform = 'spotify'; newResources[idx].type = 'audio'; newResources[idx].role = 'audio'; }
            else if (v.includes('soundcloud.com/')) { newResources[idx].platform = 'soundcloud'; newResources[idx].type = 'audio'; newResources[idx].role = 'audio'; }
            else if (v.includes('apple.com/')) { newResources[idx].platform = 'apple_music'; newResources[idx].type = 'audio'; newResources[idx].role = 'audio'; }
            else if (v.includes('bilibili.com/')) { newResources[idx].platform = 'bilibili'; newResources[idx].type = 'video'; newResources[idx].role = 'video'; }
            else if (v.includes('nicovideo.jp/')) { newResources[idx].platform = 'niconico'; newResources[idx].type = 'video'; newResources[idx].role = 'video'; }
            else if (v.includes('x.com/')) { newResources[idx].platform = 'x'; newResources[idx].type = 'social'; newResources[idx].role = 'social'; }
            else if (v.includes('ko-fi.com/')) { newResources[idx].platform = 'ko_fi'; newResources[idx].type = 'social'; newResources[idx].role = 'social'; }
            else if (v.includes('booth.pm/')) { newResources[idx].platform = 'booth'; newResources[idx].type = 'commerce'; newResources[idx].role = 'social'; }
            else if (v.includes('vgen.co/')) { newResources[idx].platform = 'vgen'; newResources[idx].type = 'social'; newResources[idx].role = 'social'; }
            else if (v.includes('skeb.jp/')) { newResources[idx].platform = 'skeb'; newResources[idx].type = 'social'; newResources[idx].role = 'social'; }
            else if (v.includes('patreon.com/')) { newResources[idx].platform = 'patreon'; newResources[idx].type = 'social'; newResources[idx].role = 'social'; }
            else if (v.includes('fanbox.cc/')) { newResources[idx].platform = 'fanbox'; newResources[idx].type = 'social'; newResources[idx].role = 'social'; }
            else if (v.includes('pixiv.net/')) { newResources[idx].platform = 'pixiv'; newResources[idx].type = 'social'; newResources[idx].role = 'social'; }
            else if (v.includes('bandcamp.com/')) { newResources[idx].platform = 'bandcamp'; newResources[idx].type = 'audio'; newResources[idx].role = 'audio'; }
            else if (v.includes('instagram.com/')) { newResources[idx].platform = 'instagram'; newResources[idx].type = 'social'; newResources[idx].role = 'social'; }
            else if (v.includes('tiktok.com/')) { newResources[idx].platform = 'tiktok'; newResources[idx].type = 'social'; newResources[idx].role = 'social'; }
            else if (v.includes('crunchyroll.com/')) { newResources[idx].platform = 'crunchyroll'; newResources[idx].type = 'video'; newResources[idx].role = 'video'; }
            else if (v.includes('netflix.com/')) { newResources[idx].platform = 'netflix'; newResources[idx].type = 'video'; newResources[idx].role = 'video'; }
            else if (v.includes('steampowered.com/') || v.includes('steamcommunity.com/')) { newResources[idx].platform = 'steam'; newResources[idx].type = 'commerce'; newResources[idx].role = 'social'; }
            else if (v.includes('amazon.com/') && (v.includes('prime') || v.includes('video'))) { newResources[idx].platform = 'amazon_prime'; newResources[idx].type = 'video'; newResources[idx].role = 'video'; }
        }
        newResources[idx] = { ...newResources[idx], [field]: value };
        if (field === 'url' && value) {
            const isYT = newResources[idx].platform === 'youtube';
            const isCurrentAuto = !thumbnailUrl || thumbnailUrl.includes('img.youtube.com') || thumbnailUrl.includes('s4.anilist.co');
            if (isYT && isCurrentAuto) {
                const id = extractMediaId(value, 'youtube');
                const thumb = getThumbnailUrl(id, 'youtube');
                if (thumb) handleExternalThumbnail(thumb);
            }
        }
        setResources(newResources);
    };

    const addCredit = () => setCredits([...credits, { entityId: '', role: '', contributorClass: 'staff', isPrimary: false, isOriginalArtist: false, position: credits.length }]);
    const removeCredit = (idx: number) => setCredits(credits.filter((_, i) => i !== idx));
    const updateCredit = (idx: number, field: keyof Credit, value: any) => {
        const newCredits = [...credits];
        newCredits[idx] = { ...newCredits[idx], [field]: value };
        setCredits(newCredits);
    };

    const handleExhibitMediaUploaded = (idx: number, mediaId: string, url: string) => {
        const next = [...exhibits];
        next[idx] = { ...next[idx], mediaId, mediaUrl: url };
        setExhibits(next);
    };

    const addSpec = () => setSpecs([...specs, { key: '', value: '' }]);
    const removeSpec = (idx: number) => setSpecs(specs.filter((_, i) => i !== idx));
    const updateSpec = (idx: number, field: keyof Spec, value: string) => {
        const newSpecs = [...specs];
        newSpecs[idx] = { ...newSpecs[idx], [field]: value };
        setSpecs(newSpecs);
    };

    const addTag = () => setTags([...tags, { name: '' }]);
    const removeTag = (idx: number) => setTags(tags.filter((_, i) => i !== idx));
    const updateTag = (idx: number, field: 'name', value: string) => {
        const newTags = [...tags];
        newTags[idx] = { ...newTags[idx], [field]: value };
        setTags(newTags);
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // 1. Upload/Prepare Thumbnail
            let finalThumbnailId = thumbnailId;
            if (pendingThumbnailFile) {
                toast.info('Uploading local thumbnail...');
                const formData = new FormData();
                formData.append('file', pendingThumbnailFile);
                formData.append('context', 'artifact_asset');
                formData.append('contextId', artifactId);
                const res = await uploadMediaAction(formData);
                finalThumbnailId = res.mediaId;
            } else if (pendingThumbnailUrl) {
                toast.info('Downloading external thumbnail...');
                const formData = new FormData();
                formData.append('url', pendingThumbnailUrl);
                formData.append('context', 'artifact_asset');
                formData.append('contextId', artifactId);
                const res = await uploadMediaAction(formData);
                finalThumbnailId = res.mediaId;
            }

            // 2. Upload/Prepare Poster
            let finalPosterId = posterId;
            if (pendingPosterFile) {
                toast.info('Uploading local poster...');
                const formData = new FormData();
                formData.append('file', pendingPosterFile);
                formData.append('context', 'artifact_asset');
                formData.append('contextId', artifactId);
                const res = await uploadMediaAction(formData);
                finalPosterId = res.mediaId;
            } else if (pendingPosterUrl) {
                toast.info('Downloading external poster...');
                const formData = new FormData();
                formData.append('url', pendingPosterUrl);
                formData.append('context', 'artifact_asset');
                formData.append('contextId', artifactId);
                const res = await uploadMediaAction(formData);
                finalPosterId = res.mediaId;
            }

            // 3. Upload/Prepare Vinyl
            let finalVinylId = vinylId;
            if (pendingVinylFile) {
                toast.info('Uploading local vinyl...');
                const formData = new FormData();
                formData.append('file', pendingVinylFile);
                formData.append('context', 'artifact_asset');
                formData.append('contextId', artifactId);
                const res = await uploadMediaAction(formData);
                finalVinylId = res.mediaId;
            } else if (pendingVinylUrl) {
                toast.info('Downloading external vinyl...');
                const formData = new FormData();
                formData.append('url', pendingVinylUrl);
                formData.append('context', 'artifact_asset');
                formData.append('contextId', artifactId);
                const res = await uploadMediaAction(formData);
                finalVinylId = res.mediaId;
            }

            // 4. Map to Assets array
            const localAssets = resources
                .filter(r => r.platform === 'r2' && r.url)
                .map(r => ({
                    mediaId: r.url.split('/').pop() || '',
                    role: r.role === 'hosted_audio' ? 'audio' : r.role,
                    isPrimary: r.isPrimary,
                    position: 0
                }));

            const visualAssets = [
                finalThumbnailId && { mediaId: finalThumbnailId, role: 'thumbnail', isPrimary: true, position: 0 },
                finalPosterId && { mediaId: finalPosterId, role: 'poster', isPrimary: false, position: 1 },
                finalVinylId && { mediaId: finalVinylId, role: 'vinyl', isPrimary: false, position: 2 },
            ].filter(Boolean) as any[];

            const finalAssets = [...visualAssets, ...localAssets];

            // 5. Build Final Payload
            const cleanCredits = credits.filter(c => c.entityId.trim() !== '');
            const cleanSpecs = specs.reduce((acc, curr) => { if (curr.key.trim()) acc[curr.key] = curr.value; return acc; }, {} as Record<string, string>);
            const cleanResources = resources.filter(r => r.url).map(r => ({ platform: r.platform, url: r.url, role: r.role, isPrimary: r.isPrimary }));
            const cleanTags = tags.filter(t => t.name.trim() !== '');
            const cleanTranslations = translations.filter(t => t.title.trim() !== '');

            const payload = {
                id: artifactId,
                category,
                animeType,
                assets: finalAssets,
                resources: cleanResources,
                credits: cleanCredits,
                exhibits: exhibits.map(ex => ({ ...ex, translations: ex.translations.filter(t => t.title.trim() !== '') })),
                specs: cleanSpecs,
                tags: cleanTags,
                translations: cleanTranslations,
                verificationId: verificationId || undefined,
                workId: workId || undefined
            };

            const validation = artifactSchema.safeParse(payload);
            if (!validation.success) {
                validation.error.issues.forEach((issue) => { toast.error(`Registry_Error: ${issue.path.join('.')}: ${issue.message}`); });
                setIsSubmitting(false);
                return;
            }

            if (initialData?.id) {
                await updateFullArtifact(initialData.id, payload as any);
                toast.success('System: Artifact Registry Updated');
            } else {
                await createFullArtifact(payload as any);
                toast.success('System: New Artifact Registered');
            }

            if (onComplete) onComplete();
            else {
                router.refresh();
                router.push('/artifacts');
            }
        } catch (e) {
            console.error(e);
            toast.error('System_Failure: Operation Terminated');
        } finally {
            setIsSubmitting(false);
        }
    }

    const upsertSpec = (key: string, value: string) => {
        const idx = specs.findIndex(s => s.key === key);
        if (idx !== -1) updateSpec(idx, 'value', value);
        else setSpecs(prev => [...prev, { key, value }]);
    };

    return (
        <div className="relative pb-24">
            <form onSubmit={handleSubmit} className="space-y-12">
                {category === 'anime' && !initialData?.id && (
                    <AnilistSync onSync={handleAnilistSync} initialIdentifier={anilistId} />
                )}

                <BasicInfoSection
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    translations={translations}
                    updateTrans={updateTrans}
                    thumbnailId={thumbnailId}
                    setThumbnailId={setThumbnailId}
                    thumbnailUrl={thumbnailUrl}
                    setThumbnailUrl={setThumbnailUrl}
                    onThumbnailFileSelect={handleThumbnailFileSelect}
                    onThumbnailUrlSelect={handleThumbnailUrlSelect}
                    posterId={posterId}
                    setPosterId={setPosterId}
                    posterUrl={posterUrl}
                    setPosterUrl={setPosterUrl}
                    onPosterFileSelect={handlePosterFileSelect}
                    onPosterUrlSelect={handlePosterUrlSelect}
                    vinylId={vinylId}
                    setVinylId={setVinylId}
                    vinylUrl={vinylUrl}
                    setVinylUrl={setVinylUrl}
                    onVinylFileSelect={handleVinylFileSelect}
                    onVinylUrlSelect={handleVinylUrlSelect}
                    category={category}
                    setCategory={setCategory}
                    animeType={animeType}
                    setAnimeType={setAnimeType}
                    artifactId={artifactId}
                    onHostedAudioUploaded={(url: string) => {
                        const existingAudio = resources.find(r => r.role === 'hosted_audio');
                        if (existingAudio) updateResource(resources.indexOf(existingAudio), 'url', url);
                        else setResources([...resources, { type: 'audio', platform: 'r2', url, role: 'hosted_audio', isPrimary: true }]);
                    }}
                    entities={entities}
                    userRole={userRole}
                    lockFlags={!!verificationId}
                    workId={workId}
                    setWorkId={setWorkId}
                    workTitle={workTitle}
                    setWorkTitle={setWorkTitle}
                />

                <ResourcesSection
                    resources={resources}
                    setResources={setResources}
                    updateResource={updateResource}
                    addResource={addResource}
                    removeResource={removeResource}
                    platforms={platforms}
                />

                <ExhibitsSection
                    exhibits={exhibits}
                    setExhibits={setExhibits}
                    artifactId={artifactId}
                    onMediaUploaded={handleExhibitMediaUploaded}
                />

                {!workId ? (
                    <MetadataSection
                        category={category}
                        isHosted={resources.some(r => r.role === 'hosted_audio' && r.platform === 'r2')}
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
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-6">
                             <Icon icon="lucide:link-2" className="text-zinc-500" width={14} />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 font-mono">04 {'//'} METADATA_INHERITANCE</span>
                        </div>
                        <div className="bg-zinc-950/40 border border-zinc-900 border-dashed p-12 rounded-xl flex flex-col items-center justify-center text-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
                                <Icon icon="lucide:link-2" className="text-zinc-500" width={20} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300">IP_Anchor_Linked</h3>
                                <p className="text-[10px] text-zinc-500 font-mono uppercase">This artifact is inheriting core attributes from:</p>
                                <p className="text-sm font-black text-rose-500 italic mt-2 uppercase tracking-tighter">
                                    {workTitle || 'SYSTEM_ANCHOR_RECORD'}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 mt-4">
                                <button type="button" onClick={() => { setWorkId(null); setWorkTitle(null); }} className="text-[9px] font-black uppercase text-zinc-600 hover:text-white transition-all border-b border-transparent hover:border-white">UNLINK_ANCHOR</button>
                                {workId && (
                                    <a href={`/works/${workId}`} target="_blank" className="text-[9px] font-black uppercase text-zinc-500 hover:text-sky-500 flex items-center gap-1 transition-all">
                                        VIEW_CANONICAL_SOURCE <Icon icon="lucide:external-link" width={10} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <CreditsSection
                    locale={activeTab}
                    entities={entities}
                    credits={credits}
                    updateCredit={updateCredit}
                    addCredit={addCredit}
                    removeCredit={removeCredit}
                />

                <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-zinc-900 p-4 z-50 animate-in slide-in-from-bottom-full duration-500">
                    <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
                        <div className="hidden md:flex items-center gap-6 text-zinc-500">
                             <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">System_Prompt: Ensure all records are verified before commitment.</span>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={() => router.push('/artifacts')}
                                className="flex-1 md:flex-none px-8 py-3 bg-zinc-950 border border-zinc-800 text-zinc-400 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-900 hover:text-white transition-all rounded-lg"
                            >
                                EXIT_REGISTRY
                            </button>
                            <button
                                disabled={isSubmitting}
                                type="submit"
                                className="flex-1 md:flex-none px-12 py-3 bg-rose-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50 rounded-lg shadow-[0_0_30px_rgba(225,29,72,0.2)]"
                            >
                                {isSubmitting ? 'PROCESSING_REQUEST...' : initialData?.id ? 'COMMIT_REGISTRY_CHANGES' : 'REGISTER_NEW_ARTIFACT'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

