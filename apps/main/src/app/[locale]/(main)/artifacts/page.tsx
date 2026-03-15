import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { getAllArtifacts, getAllWorks, resolveTranslation } from '@shimokitan/db';
import ArtifactsBrowser from './ArtifactsBrowser';
import type { Metadata } from 'next';

import { getDictionary, Locale } from "@shimokitan/utils";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const locale = (await params).locale;
    const dict = getDictionary(locale as Locale);
    return {
        title: dict.navigation.artifacts,
        description: dict.home.recent_shards,
    };
}

export const dynamic = 'force-dynamic';

export default async function ArtifactsBrowsePage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    const [artifacts, works] = await Promise.all([
        getAllArtifacts(),
        getAllWorks()
    ]);

    // 1. Process Works (Primary for Anime/Games)
    const formattedWorks = works.map((w: any) => {
        const translation = resolveTranslation(w.translations, locale);
        const primaryCredit = w.credits?.find((c: any) => c.isPrimary) || w.credits?.[0];
        const artistName = resolveTranslation(primaryCredit?.entity?.translations, locale)?.name;

        return {
            id: w.id,
            slug: w.slug,
            title: translation?.title || "Untitled",
            category: w.category,
            coverImage: w.poster?.url || w.thumbnail?.url || null,
            status: w.status,
            resonance: w.resonance || 0,
            isMajor: (w.resonance || 0) > 20,
            isVerified: w.isVerified ?? false,
            artist: artistName || "ANONYMOUS",
            type: 'work' as const,
            aspectRatio: (w.category === 'anime' || w.category === 'game') ? 'vertical' as const : 'video' as const
        };
    });

    // 2. Process Artifacts (Primary for Music / Standalone)
    const formattedArtifacts = artifacts.map((a: any) => {
        const translation = resolveTranslation(a.translations, locale);
        
        // Inherit from Work if available, otherwise use artifact level
        const sourceWork = a.work;
        const artistName = sourceWork 
            ? resolveTranslation(sourceWork.credits?.find((c: any) => c.isPrimary)?.entity?.translations, locale)?.name
            : resolveTranslation(a.credits?.find((c: any) => c.isPrimary)?.entity?.translations, locale)?.name;

        return {
            id: a.id,
            slug: a.slug,
            title: translation?.title || "Untitled",
            category: a.category,
            coverImage: a.thumbnail?.url || a.poster?.url || null,
            status: a.status,
            resonance: a.resonance || 0,
            isMajor: (a.resonance || 0) > 10,
            isVerified: a.isVerified ?? false,
            artist: artistName || "ANONYMOUS_SOURCE",
            type: 'artifact' as const,
            aspectRatio: 'video' as const
        };
    });

    // 3. Merged Registry
    // Logic: 
    // - For Anime/Game: Show ONLY the Work.
    // - For Music: Show all Artifacts (since each song is unique).
    const mergedRegistry = [
        ...formattedWorks.filter(w => w.category === 'anime' || w.category === 'game'),
        ...formattedArtifacts.filter(a => a.category === 'music')
    ].sort((a, b) => (b.resonance || 0) - (a.resonance || 0));

    return (
        <MainLayout>
            <ArtifactsBrowser initialArtifacts={mergedRegistry} />
        </MainLayout>
    );
}
