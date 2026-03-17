"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { createFullEntity, updateFullEntity } from '../actions';
import { useRouter } from 'next/navigation';
import EntitySearchPicker from '../artifacts/components/EntitySearchPicker';
import { MediaUploader } from '@shimokitan/ui';
 import { uploadMediaAction } from '../media-actions';
import { CREDIT_ROLES } from '@shimokitan/utils';
  import { toast } from 'sonner';
 import { extractMediaId, getThumbnailUrl } from '@shimokitan/utils';

type SocialLink = {
    platform: string;
    url: string;
};

type Member = {
    memberId: string;
    memberRole: string;
};

export interface Platform {
    id: string;
    name: string;
    category: string;
}

export default function EntityForm({
    initialData,
    entities = [],
    platforms = []
}: {
    initialData?: any,
    entities?: { id: string, name: string, type: string }[],
    platforms?: Platform[]
}) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'en' | 'id' | 'ja'>('en');

    // Multi-Language State
    const [translations, setTranslations] = useState(
        ['en', 'id', 'ja'].map(lang => {
            const trans = initialData?.translations?.find((t: any) => t.locale === lang);
            return {
                locale: lang as 'en' | 'id' | 'ja',
                name: trans?.name || '',
                status: trans?.status || '',
                bio: trans?.bio || ''
            };
        })
    );

    const [isVerified, setIsVerified] = useState(initialData?.isVerified || false);
    const [isEncrypted, setIsEncrypted] = useState(initialData?.isEncrypted || false);
    const [type, setType] = useState(initialData?.type || 'independent');
    const [members, setMembers] = useState<Member[]>(
        initialData?.members?.map((m: any) => ({ memberId: m.memberId, memberRole: m.memberRole })) || []
    );

    // Dynamic List
    const [socials, setSocials] = useState<SocialLink[]>(
        initialData?.socialLinks
            ? (Array.isArray(initialData.socialLinks)
                ? initialData.socialLinks
                : Object.entries(initialData.socialLinks).map(([platform, url]) => ({ platform, url: url as string })))
            : [{ platform: 'x', url: '' }]
    );

    const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData?.avatar?.url || initialData?.avatarUrl || null);
    const [avatarId, setAvatarId] = useState<string | null>(initialData?.avatarId || null);
    const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);

    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(initialData?.thumbnail?.url || initialData?.thumbnailUrl || null);
    const [thumbnailId, setThumbnailId] = useState<string | null>(initialData?.thumbnailId || null);
    const [pendingThumbnailUrl, setPendingThumbnailUrl] = useState<string | null>(null);

    const [uid, setUid] = useState(initialData?.uid || '');
    const [slug, setSlug] = useState(initialData?.slug || '');
    const [tags, setTags] = useState<{ name: string }[]>(
        initialData?.tags?.map((t: any) => ({ name: t.tag.translations?.[0]?.name || '' })) || []
    );

    const SUGGESTED_IDENTITIES = ['VSinger', 'VTuber', 'Utaite', 'Illustrator', 'Vocaloid Producer', 'Animator', 'Composer', 'Voice Actor'];

    // CTRL+S save handler
    const handleSave = useCallback(async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        const t = toast.loading(`${initialData?.id ? 'UPDATING_RECORD' : 'PUBLISHING_RECORD'}...`);

        try {
            let finalAvatarId = avatarId;
            let finalThumbnailId = thumbnailId;

            if (pendingAvatarUrl) {
                const formData = new FormData();
                formData.append('url', pendingAvatarUrl);
                formData.append('context', 'entity_avatar');
                const res = await uploadMediaAction(formData);
                finalAvatarId = res.mediaId;
            }

            if (pendingThumbnailUrl) {
                const formData = new FormData();
                formData.append('url', pendingThumbnailUrl);
                formData.append('context', 'entity_thumbnail');
                const res = await uploadMediaAction(formData);
                finalThumbnailId = res.mediaId;
            }

            const cleanSocials = socials.filter(s => s.platform.trim() && s.url.trim());
            const payload = {
                type,
                uid: uid || null,
                isVerified,
                isEncrypted,
                slug: slug || null,
                socialLinks: cleanSocials,
                translations: translations.filter(t => t.name.trim() !== ''),
                members: type === 'circle' ? members.filter(m => m.memberId) : [],
                tags: tags.filter(t => t.name.trim() !== ''),
                avatarId: finalAvatarId,
                thumbnailId: finalThumbnailId
            };

            if (initialData?.id) {
                await updateFullEntity(initialData.id, payload as any);
                toast.success('Professional Record Updated successfully', { id: t });
            } else {
                await createFullEntity(payload as any);
                toast.success('New Professional Record Published', { id: t });
            }

            router.refresh();
            router.push('/entities');
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || 'Transmission_Failure: Signal lost during commit', { id: t });
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, initialData?.id, socials, type, uid, slug, isVerified, isEncrypted, translations, members, avatarId, thumbnailId, pendingAvatarUrl, pendingThumbnailUrl, router, tags]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    const updateTrans = (locale: string, field: 'name' | 'bio' | 'status', value: string) => {
        setTranslations(translations.map(t => t.locale === locale ? { ...t, [field]: value } : t));
    };

    const addSocial = () => setSocials([...socials, { platform: platforms[0]?.id || 'x', url: '' }]);
    const removeSocial = (idx: number) => setSocials(socials.filter((_, i) => i !== idx));
    const updateSocial = (idx: number, field: keyof SocialLink, value: string) => {
        const newSocials = [...socials];
        newSocials[idx] = { ...newSocials[idx], [field]: value };
        setSocials(newSocials);
    };

    const addMember = () => setMembers([...members, { memberId: '', memberRole: '' }]);
    const removeMember = (idx: number) => setMembers(members.filter((_, i) => i !== idx));
    const updateMember = (idx: number, field: keyof Member, value: string) => {
        const newMembers = [...members];
        newMembers[idx] = { ...newMembers[idx], [field]: value };
        setMembers(newMembers);
    };
    const addTag = (name: string = '') => {
        if (name && tags.some(t => t.name.toLowerCase() === name.toLowerCase())) return;
        setTags([...tags, { name }]);
    };
    const removeTag = (idx: number) => setTags(tags.filter((_, i) => i !== idx));
    const updateTag = (idx: number, name: string) => {
        const newTags = [...tags];
        newTags[idx] = { name };
        setTags(newTags);
    };

    const handleAvatarUrlSelect = (url: string) => {
        let targetUrl = url;
        if (url.includes('youtube.com/') || url.includes('youtu.be/')) {
            const id = extractMediaId(url, 'youtube');
            const thumb = getThumbnailUrl(id, 'youtube');
            if (thumb) targetUrl = thumb;
        }
        setAvatarUrl(targetUrl);
        setPendingAvatarUrl(targetUrl);
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

    return (
        <div className="relative pb-24">
            <div className="space-y-6">
                <div className="space-y-8">
                    {/* 01. REGISTRY & VISUALS */}
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-6">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">01 // REGISTRY_&_VISUALS</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-violet-500">System_Meta</h3>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono uppercase text-zinc-400 pl-1">Identity_Type</label>
                                        <select
                                            name="type"
                                            value={type}
                                            onChange={(e) => setType(e.target.value as any)}
                                            required
                                            className="w-full bg-zinc-950 border border-zinc-900 p-3 text-xs text-white focus:border-violet-600 outline-none transition-all rounded-lg appearance-none cursor-pointer"
                                        >
                                            <option value="independent">INDEPENDENT_REGISTRY</option>
                                            <option value="organization">ORGANIZATION_ENTITY</option>
                                            <option value="agency">MANAGEMENT_AGENCY</option>
                                            <option value="circle">CREATIVE_CIRCLE (UNIT)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono uppercase text-zinc-400 pl-1">Handle_Reference</label>
                                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-900 focus-within:border-violet-600 outline-none transition-all rounded-lg pl-3 pr-1">
                                            <span className="text-[10px] font-mono text-zinc-600">@</span>
                                            <input
                                                value={slug}
                                                onChange={(e) => setSlug(e.target.value)}
                                                className="w-full bg-transparent border-none p-3 pl-0 text-xs text-white outline-none font-mono"
                                                placeholder="custom-alias-here..."
                                            />
                                        </div>
                                        <p className="text-[8px] text-zinc-600 font-mono italic pl-2">System current: {initialData?.slug || 'PENDING'}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono uppercase text-zinc-400 pl-1">External_UID</label>
                                        <input
                                            value={uid}
                                            onChange={(e) => setUid(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-900 p-3 text-xs text-white focus:border-violet-600 outline-none transition-all rounded-lg font-mono"
                                            placeholder="MAL_ID / ANILIST_ID..."
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <div
                                            className={`flex items-center justify-center gap-2 border cursor-pointer transition-all h-[46px] rounded-lg ${isVerified ? 'bg-violet-600 border-violet-500 text-black shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-violet-900'}`}
                                            onClick={() => setIsVerified(!isVerified)}
                                        >
                                            <Icon icon={isVerified ? "lucide:shield-check" : "lucide:shield"} width={16} />
                                            <span className="text-[10px] font-black uppercase">Verified_Link</span>
                                        </div>
                                    </div>

                                    <div className="pt-1">
                                        <div
                                            className={`flex items-center justify-center gap-2 border cursor-pointer transition-all h-[46px] rounded-lg ${isEncrypted ? 'bg-rose-600 border-rose-500 text-black shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-rose-900'}`}
                                            onClick={() => setIsEncrypted(!isEncrypted)}
                                        >
                                            <Icon icon={isEncrypted ? "lucide:lock" : "lucide:lock-open"} width={16} />
                                            <span className="text-[10px] font-black uppercase">Encrypted_Signal</span>
                                        </div>
                                        {isEncrypted && (
                                            <p className="text-[8px] text-rose-500/60 font-mono italic mt-2 text-center leading-relaxed">
                                                CONSENT_FIRST: Profile will be sealed. Name-only reference for cover attribution.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3 space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-violet-500">Visual_Branding</h3>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 bg-zinc-950/50 border border-zinc-900 rounded-xl relative overflow-hidden group">
                                    <div className="md:col-span-3 space-y-2">
                                        <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">Avatar_Symbol</label>
                                        <MediaUploader
                                            value={avatarUrl}
                                            uploadAction={uploadMediaAction}
                                            onChange={(id, url) => { setAvatarId(id); setAvatarUrl(url); }}
                                            onUrlSelect={handleAvatarUrlSelect}
                                            contextType="entity_avatar"
                                            className="w-full aspect-square"
                                        />
                                    </div>
                                    <div className="md:col-span-9 space-y-2">
                                        <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">Thumbnail_Branding</label>
                                        <MediaUploader
                                            value={thumbnailUrl}
                                            uploadAction={uploadMediaAction}
                                            onChange={(id, url) => { setThumbnailId(id); setThumbnailUrl(url); }}
                                            onUrlSelect={handleThumbnailUrlSelect}
                                            contextType="entity_thumbnail"
                                            className="w-full aspect-[21/9] md:aspect-[16/6]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 02. LOCALIZATION MATRIX */}
                    <div className="w-full pt-8 border-t border-zinc-900">
                        <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-6">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">02 // LOCALIZATION_MATRIX</span>
                        </div>
                        <div className="flex flex-col bg-zinc-950 p-6 border border-zinc-900 rounded-xl">
                            <div className="flex items-center justify-between mb-8 border-b border-zinc-900/50 pb-6">
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-violet-500 italic">I18n_Localization_Matrix</h3>
                                    <p className="text-[9px] text-zinc-600 font-mono italic">MULTILINGUAL_METADATA_SYNCHRONIZATION.</p>
                                </div>
                                <div className="flex gap-1 bg-black p-1 rounded-lg border border-zinc-900">
                                    {translations.map(t => (
                                        <button
                                            key={t.locale}
                                            type="button"
                                            onClick={() => setActiveTab(t.locale)}
                                            className={`px-6 py-2 text-[10px] font-black uppercase transition-all rounded-md ${activeTab === t.locale ? 'bg-violet-600 text-black' : 'text-zinc-500 hover:text-white'}`}
                                        >
                                            {t.locale}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {translations.map(t => (
                                <div key={t.locale} className={activeTab === t.locale ? 'space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500' : 'hidden'}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-mono uppercase text-zinc-400 pl-1">Public_Identifier ({t.locale})</label>
                                            <input
                                                value={t.name}
                                                onChange={(e) => updateTrans(t.locale, 'name', e.target.value)}
                                                className="w-full bg-black border border-zinc-800 p-4 text-sm text-white focus:border-violet-600 outline-none transition-all rounded-lg font-bold"
                                                placeholder={`Entity Name in ${t.locale.toUpperCase()}`}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-mono uppercase text-zinc-400 pl-1">Professional_Designation ({t.locale})</label>
                                            <input
                                                value={t.status || ''}
                                                onChange={(e) => updateTrans(t.locale, 'status', e.target.value)}
                                                className="w-full bg-black border border-zinc-800 p-4 text-sm text-white focus:border-violet-600 outline-none transition-all rounded-lg"
                                                placeholder="e.g. Vocaloid Producer / Illustrator"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-mono uppercase text-zinc-400 pl-1">Identity_Manifesto ({t.locale})</label>
                                        <textarea
                                            value={t.bio}
                                            onChange={(e) => updateTrans(t.locale, 'bio', e.target.value)}
                                            rows={8}
                                            className="w-full bg-black border border-zinc-800 p-4 text-sm text-white focus:border-violet-600 outline-none transition-all rounded-lg resize-none leading-relaxed"
                                            placeholder="System bio / entity description / historical context..."
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 03. IDENTITY_NODES (Professional Roles) */}
                <div className="space-y-4 pt-8 border-t border-zinc-900 mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                            <span className="text-xs font-black uppercase text-violet-500 tracking-[0.2em]">03 // IDENTITY_CLASS_NODES</span>
                            <p className="text-[9px] text-zinc-600 font-mono italic">ENTERPRISE_GRADE_ENTITY_CLASSIFICATION.</p>
                        </div>
                    </div>

                    <div className="bg-zinc-950 p-6 border border-zinc-900 rounded-xl space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-mono uppercase text-zinc-500">Quick_inject_Identity</label>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTED_IDENTITIES.map(idnt => (
                                    <button
                                        key={idnt}
                                        type="button"
                                        onClick={() => addTag(idnt)}
                                        className="px-3 py-1.5 bg-black border border-zinc-800 text-[9px] font-black uppercase tracking-tighter text-zinc-400 hover:border-violet-600 hover:text-white transition-all rounded"
                                    >
                                        + {idnt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-mono uppercase text-zinc-500">Active_Identity_Labels</label>
                            <div className="flex flex-wrap gap-3 p-4 bg-black border border-zinc-900/50 rounded-lg min-h-[60px] items-center">
                                {tags.length === 0 && <span className="text-[10px] text-zinc-800 font-mono italic uppercase">No_Identities_Mapped_To_Entity...</span>}
                                {tags.map((tag, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-violet-600/10 border border-violet-900/50 px-3 py-1.5 rounded-md group animate-in zoom-in-95 duration-200">
                                        <input
                                            value={tag.name}
                                            onChange={(e) => updateTag(i, e.target.value)}
                                            className="bg-transparent border-none text-[10px] font-black uppercase text-violet-400 focus:outline-none focus:text-white transition-colors min-w-[60px]"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    (e.target as HTMLInputElement).blur();
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeTag(i)}
                                            className="text-violet-900 hover:text-rose-500 transition-colors"
                                        >
                                            <Icon icon="lucide:x" width={12} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => addTag('')}
                                    className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-zinc-800 text-zinc-600 hover:border-zinc-500 hover:text-white transition-all rounded-md text-[10px] font-black uppercase"
                                >
                                    <Icon icon="lucide:plus" width={12} /> CUSTOM_IDENTITY
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Unit Members Section */}
                {type === 'circle' && (
                    <div className="space-y-4 pt-8 border-t border-zinc-900 mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="space-y-1">
                            <span className="text-xs font-black uppercase text-violet-500 tracking-[0.2em]">04 // UNIT_COMPOSITION_LEDGER</span>
                            <p className="text-[9px] text-zinc-600 font-mono">LINK INDEPENDENT ENTITIES TO THIS CREATIVE NODE.</p>
                        </div>
                            <button type="button" onClick={addMember} className="bg-zinc-950 border border-zinc-800 px-4 py-2 text-[10px] uppercase font-bold text-violet-500 hover:text-white hover:border-violet-600 flex items-center gap-2 transition-all rounded-lg">
                                <Icon icon="lucide:user-plus" width={14} /> ADD_MEMBER_NODE
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {members.map((member, i) => (
                                <div key={i} className="flex gap-4 items-center bg-black p-4 border border-zinc-900 rounded-xl hover:border-zinc-700 transition-colors">
                                    <div className="flex-1">
                                        <EntitySearchPicker
                                            label="INDEPENDENT_RECORD"
                                            type="independent"
                                            value={member.memberId}
                                            onSelect={(entity) => updateMember(i, 'memberId', entity?.id || '')}
                                            placeholder="Search Global Registry..."
                                            entities={entities}
                                        />
                                    </div>
                                     <div className="flex-1 space-y-1">
                                         <label className="text-[9px] font-mono text-zinc-600 uppercase italic">Unit_Role ({activeTab})</label>
                                         <select
                                             value={member.memberRole || ''}
                                             onChange={(e) => updateMember(i, 'memberRole', e.target.value)}
                                             className="w-full bg-zinc-950 border border-zinc-800 p-2 text-[10px] text-white rounded-md font-mono uppercase focus:border-violet-600 outline-none appearance-none cursor-pointer"
                                         >
                                             <option value="" disabled>Select Department...</option>
                                             {CREDIT_ROLES.map((r) => (
                                                 <option key={r.slug} value={r.slug} className="bg-zinc-950">
                                                     {r.labels[activeTab as 'en' | 'ja'] || r.labels.en}
                                                 </option>
                                             ))}
                                         </select>
                                     </div>
                                    <button type="button" onClick={() => removeMember(i)} className="text-zinc-700 hover:text-rose-500 transition-colors pt-4">
                                        <Icon icon="lucide:trash-2" width={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Social Links */}
                <div className="space-y-4 pt-8 border-t border-zinc-900 mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                            <span className="text-xs font-black uppercase text-violet-500 tracking-[0.2em]">05 // SOCIAL_NETWORK_NODES</span>
                            <p className="text-[9px] text-zinc-600 font-mono">EXTERNAL COMMUNICATION ENDPOINTS.</p>
                        </div>
                        <button type="button" onClick={addSocial} className="bg-zinc-950 border border-zinc-800 px-4 py-2 text-[10px] uppercase font-bold text-violet-500 hover:text-white hover:border-violet-600 flex items-center gap-2 transition-all rounded-lg">
                            <Icon icon="lucide:share-2" width={14} /> ADD_NETWORK_EXIT
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {socials.map((link, i) => (
                            <div key={i} className="flex gap-3 items-center bg-black p-3 border border-zinc-900 rounded-xl hover:border-zinc-800 transition-colors">
                                <div className="w-40 shrink-0">
                                    <select
                                        value={link.platform}
                                        onChange={(e) => updateSocial(i, 'platform', e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 p-2.5 text-[10px] text-white rounded-lg focus:border-violet-600 outline-none cursor-pointer uppercase font-bold"
                                    >
                                        {(platforms.length > 0 ? platforms : [
                                            { id: 'x', name: 'X' },
                                            { id: 'youtube', name: 'YouTube' },
                                            { id: 'instagram', name: 'Instagram' },
                                        ]).map(p => (
                                            <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                                        ))}
                                        <option value="other">OTHER_NODE</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <input
                                        value={link.url}
                                        onChange={(e) => updateSocial(i, 'url', e.target.value)}
                                        placeholder="Enter full URL endpoint..."
                                        className="w-full bg-zinc-950 border border-zinc-800 p-2.5 text-xs text-white rounded-lg focus:border-violet-600 outline-none font-mono"
                                    />
                                </div>
                                <button type="button" onClick={() => removeSocial(i)} className="text-zinc-700 hover:text-rose-500 transition-colors px-2">
                                    <Icon icon="lucide:x-circle" width={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sticky Save Bar */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-black/80 backdrop-blur-xl border-t border-zinc-900 p-4 z-50 animate-in slide-in-from-bottom-full duration-500">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
                    <div className="hidden md:flex items-center gap-6 text-zinc-500">
                        <div className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono">ESC</kbd>
                            <span className="text-[10px] uppercase font-bold">Discard</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono">^ S</kbd>
                            <span className="text-[10px] uppercase font-bold">Commit_Changes</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 md:flex-none px-8 py-3 bg-zinc-950 border border-zinc-800 text-zinc-400 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-900 hover:text-white transition-all rounded-lg"
                        >
                            CANCEL_STREAMS
                        </button>
                        <button
                            onClick={() => handleSave()}
                            disabled={isSubmitting}
                            type="button"
                            className="flex-1 md:flex-none px-12 py-3 bg-violet-600 text-black font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all disabled:opacity-50 rounded-lg shadow-[0_0_30px_rgba(139,92,246,0.2)]"
                        >
                            {isSubmitting ? 'COMMITTING_TRANSACTION...' : initialData?.id ? 'UPGRADE_RECORD' : 'PUBLISH_ENTITY'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
