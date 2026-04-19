import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { getAllEntities, resolveTranslation } from '@shimokitan/db';
import ArtistsBrowser from './ArtistsBrowser';
import { getDictionary, Locale } from "@shimokitan/utils";
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const locale = (await params).locale;
    const dict = getDictionary(locale as Locale);
    return {
        title: dict.navigation.artists,
        description: dict.home.district,
        alternates: {
            canonical: `/${locale}/artists`,
        },
    };
}

export default async function ArtistsBrowsePage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    const entities = await getAllEntities();

    // Filter for active residents only. Sealed signal fragments have no public surface area.
    const formattedEntities = entities
        .filter((e: any) => e.civilStatus === 'resident')
        .map((e: any) => {
        const translation = resolveTranslation(e.translations, locale);
        return {
            id: e.id,
            slug: e.slug,
            name: translation?.name || (e as any).name || "Anonymous Artist",
            type: e.type,
            avatarUrl: e.avatar?.url,
            thumbnailUrl: e.thumbnail?.url,
            civilStatus: e.civilStatus,
            artifactCount: e.credits?.length || 0
        };
    });

    return (
        <ArtistsBrowser initialEntities={formattedEntities} />
    );
}
