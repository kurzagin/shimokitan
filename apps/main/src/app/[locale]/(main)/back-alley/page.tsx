import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { getAllArtifacts, resolveTranslation } from '@shimokitan/db';
import BackAlleyBrowser from './BackAlleyBrowser';
import type { Metadata } from 'next';

import { getDictionary, Locale } from "@shimokitan/utils";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const locale = (await params).locale;
    const dict = getDictionary(locale as Locale);
    return {
        title: dict.navigation.back_alley,
    };
}

export const dynamic = "force-dynamic";

export default async function BackAlleyPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    const artifacts = await getAllArtifacts();

    // Map DB artifacts to the format expected by the browser component
    // Filter out only music items
    const formattedArtifacts = artifacts
        .filter((a: any) => a.category === 'music')
        .map((a: any) => {
            const translation = resolveTranslation(a.translations, locale);
            const primaryCredit = a.credits?.find((c: any) => c.isPrimary && (c.contributorClass === 'author' || c.contributorClass === 'collaborator')) || a.credits?.[0];
            const artistName = resolveTranslation(primaryCredit?.entity?.translations, locale)?.name;

            return {
                id: a.id,
                slug: a.slug,
                title: translation?.title || (a as any).title || "Untitled",
                category: a.category || "UNKNOWN",
                nature: a.nature || "original",
                coverImage: a.thumbnail?.url || a.poster?.url || null,
                status: a.status,
                resonance: a.resonance || 0,
                isMajor: (a.resonance || 0) > 10,
                isVerified: a.isVerified ?? false,
                artist: artistName || "ANONYMOUS"
            };
        });

    return (
        <MainLayout>
            <BackAlleyBrowser initialArtifacts={formattedArtifacts} />
        </MainLayout>
    );
}
