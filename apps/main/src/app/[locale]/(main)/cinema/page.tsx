import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { getCinemaData, resolveTranslation } from '@shimokitan/db';
import ArtifactsBrowser from './ArtifactsBrowser';
import type { Metadata } from 'next';

import { getDictionary, Locale } from "@shimokitan/utils";

const getMediaByRole = (media: any[], role: string) => media?.find((m: any) => m.role === role)?.media;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const locale = (await params).locale;
    const dict = getDictionary(locale as Locale);
    return {
        title: `${dict.navigation.artifacts} // CINEMA`,
        description: dict.cinema.description,
    };
}

export const dynamic = 'force-dynamic';

export default async function CinemaBrowsePage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    const dict = getDictionary(locale as Locale);
    const { artifacts, exhibits } = await getCinemaData();

    // 1. Process Music Artifacts
    const formattedMusic = artifacts.map((a: any) => {
        const translation = resolveTranslation(a.translations, locale);
        
        // Use Work credits first, then Artifact credits
        const sourceWork = a.work;
        const primaryCredit = sourceWork 
            ? sourceWork.credits?.find((c: any) => c.isPrimary) || sourceWork.credits?.[0]
            : a.credits?.find((c: any) => c.isPrimary) || a.credits?.[0];
            
        const artistName = resolveTranslation(primaryCredit?.entity?.translations, locale)?.name;

        const thumbnail = getMediaByRole(a.media, 'thumbnail');
        const poster = getMediaByRole(a.media, 'poster');

        return {
            id: a.id,
            slug: a.slug,
            title: translation?.title || dict.common.seo.artifact_untitled,
            category: a.category,
            coverImage: thumbnail?.url || poster?.url || null,
            status: a.status,
            resonance: a.resonance || 0,
            isMajor: (Number(a.resonance) || 0) > 10,
            isVerified: a.isVerified ?? false,
            artist: artistName || "ANONYMOUS_SOURCE",
            type: 'artifact' as const,
            aspectRatio: 'video' as const
        };
    });

    // 2. Process Exhibits (Anime/Game trailers)
    const formattedExhibits = exhibits.map((e: any) => {
        const exhibitTrans = resolveTranslation(e.translations, locale);
        const parentTrans = resolveTranslation(e.artifact?.translations, locale);
        
        const sourceWork = e.artifact?.work;
        const primaryCredit = sourceWork 
            ? sourceWork.credits?.find((c: any) => c.isPrimary) || sourceWork.credits?.[0]
            : e.artifact?.credits?.find((c: any) => c.isPrimary) || e.artifact?.credits?.[0];

        const artistName = resolveTranslation(primaryCredit?.entity?.translations, locale)?.name;

        return {
            id: e.artifactId, // Link to the main artifact page
            exhibitId: e.id,
            slug: e.artifact?.slug,
            title: exhibitTrans?.title || parentTrans?.title || "Untitled Exhibit",
            category: e.artifact?.category,
            coverImage: e.media?.url || null,
            status: e.artifact?.status,
            resonance: e.artifact?.resonance || 0,
            isMajor: (Number(e.artifact?.resonance) || 0) > 20,
            isVerified: e.artifact?.isVerified ?? false,
            artist: artistName || "ANONYMOUS",
            type: 'exhibit' as const,
            aspectRatio: 'video' as const
        };
    });

    const mergedRegistry = [
        ...formattedExhibits,
        ...formattedMusic
    ].sort((a, b) => (Number(b.resonance) || 0) - (Number(a.resonance) || 0));

    return (
        <MainLayout>
            <ArtifactsBrowser initialArtifacts={mergedRegistry} dict={dict} />
        </MainLayout>
    );
}
