import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { getDb, resolveTranslation, schema, and, eq, isNull, desc } from '@shimokitan/db';
import GalleryBrowser from './GalleryBrowser';
import type { Metadata } from 'next';
import { getDictionary, Locale } from "@shimokitan/utils";

/**
 * Resolves the best available image URL from an artifact's media array.
 * Priority: NETWORK_GATEWAYS > cover > thumbnail > any
 */
const resolveImage = (media: any[]): string | null => {
    if (!media || !Array.isArray(media)) return null;
    for (const role of ["NETWORK_GATEWAYS", "cover", "thumbnail"]) {
        const match = media.find((m: any) => m.role === role);
        if (match?.media?.url) return match.media.url;
    }
    const fallback = media.find((m: any) => m.media?.url);
    return fallback?.media?.url || null;
};

/**
 * Resolves width/height from the first available media record.
 */
const resolveSize = (media: any[]): { width: number; height: number } => {
    if (!media || !Array.isArray(media)) return { width: 1, height: 1 };
    for (const role of ["NETWORK_GATEWAYS", "cover", "thumbnail"]) {
        const match = media.find((m: any) => m.role === role);
        if (match?.media?.width && match?.media?.height) {
            return { width: match.media.width, height: match.media.height };
        }
    }
    return { width: 1, height: 1 };
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const locale = (await params).locale;
    const dict = getDictionary(locale as Locale);
    return {
        title: `${dict.navigation.gallery} // SHIMOKITAN`,
        description: "Visual shards and illustrations from the district's residents.",
    };
}

export default async function GalleryPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    const db = getDb();
    if (!db) return <div>DB_OFFLINE</div>;
    const dict = getDictionary(locale as Locale);

    let illustrations: any[] = [];

    try {
        const rawArtifacts = await db.query.artifacts.findMany({
            where: and(
                eq(schema.artifacts.category, 'illustration'),
                isNull(schema.artifacts.deletedAt)
            ),
            orderBy: [desc(schema.artifacts.resonance)],
            limit: 6,
            with: {
                media: {
                    with: {
                        media: true
                    }
                },
                translations: true,
                credits: {
                    with: {
                        entity: {
                            with: {
                                translations: true
                            }
                        }
                    }
                }
            }
        });

        illustrations = rawArtifacts.map((a: any) => {
            const translation = resolveTranslation(a.translations, locale);
            const primaryCredit = a.credits?.find((c: any) => c.isPrimary) || a.credits?.[0];
            const entityTrans = resolveTranslation(primaryCredit?.entity?.translations, locale);
            const size = resolveSize(a.media);

            return {
                id: a.id,
                slug: a.slug || a.id,
                title: translation?.title || "Untitled Shard",
                artist: entityTrans?.name || primaryCredit?.entity?.name || "ANONYMOUS",
                image: resolveImage(a.media),
                resonance: a.resonance || 0,
                description: translation?.description || "",
                category: a.category,
                width: size.width,
                height: size.height,
            };
        });
    } catch (e) {
        console.error("[GALLERY] Failed to fetch illustrations:", e);
    }

    // Ambient Data (Weather)
    let weatherTemp = "8C";
    try {
        const weatherRes = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=35.6611&longitude=139.6666&current_weather=true",
            { next: { revalidate: 1800 } }
        );
        if (weatherRes.ok) {
            const weatherData = await weatherRes.json();
            if (weatherData?.current_weather?.temperature) {
                weatherTemp = `${Math.round(weatherData.current_weather.temperature)}C`;
            }
        }
    } catch (e) {}

    return (
        <MainLayout>
            <GalleryBrowser
                illustrations={illustrations}
                dict={dict}
                weatherTemp={weatherTemp}
            />
        </MainLayout>
    );
}
