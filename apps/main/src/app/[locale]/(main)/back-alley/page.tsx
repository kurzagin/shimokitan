import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { getDb, schema, eq, and, desc, resolveTranslation } from '@shimokitan/db';
import BackAlleyBrowser from './BackAlleyBrowser';
import type { Metadata } from 'next';

import { getDictionary, Locale } from "@shimokitan/utils";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const locale = (await params).locale;
    const dict = getDictionary(locale as Locale);
    return {
        title: dict.navigation.back_alley,
        alternates: {
            canonical: `/${locale}/back-alley`,
        },
    };
}

export const dynamic = "force-dynamic";

export default async function BackAlleyPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    const db = getDb();
    if (!db) {
        return <BackAlleyBrowser initialArtifacts={[]} />;
    }

    const hostedResources = await db.query.artifactResources.findMany({
      where: and(
        eq(schema.artifactResources.role, 'hosted_audio'),
        eq(schema.artifactResources.isActive, true)
      ),
      orderBy: [desc(schema.artifactResources.createdAt)],
      with: {
        artifact: {
          with: {
            media: {
              with: {
                media: true
              }
            },
            translations: true,
            resources: true,
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
        }
      }
    });

    const formattedArtifacts = hostedResources
        .filter((r: any) => r.artifact) // Ensure artifact exists
        .map((r: any) => {
            const a = r.artifact;
            const translation = resolveTranslation(a.translations, locale);
            
            const artistNames = a.credits
                ?.filter((c: any) => c.isPrimary)
                .map((c: any) => {
                    const entityTrans = resolveTranslation(c.entity?.translations, locale);
                    return entityTrans?.name || c.entity?.name;
                })
                .filter(Boolean)
                .join(", ") || "Unknown Artist";

            const artifactMedia = (a.media as any[]) || [];
            const vinyl = artifactMedia.find((m: any) => m.role === 'vinyl')?.media;
            const thumbnail = artifactMedia.find((m: any) => m.role === 'thumbnail')?.media;
            const poster = artifactMedia.find((m: any) => m.role === 'poster')?.media;
            const cover = artifactMedia.find((m: any) => m.role === 'cover')?.media;
            const firstAnyImage = artifactMedia.find((m: any) => m.media?.type === 'image')?.media;

            const coverImage = vinyl?.url || thumbnail?.url || poster?.url || cover?.url || firstAnyImage?.url || null;

            return {
                id: a.id,
                slug: a.slug,
                title: translation?.title || a.title || "Untitled",
                category: a.category || "UNKNOWN",
                nature: a.nature || "original",
                coverImage,
                resonance: a.resonance || 0,
                isMajor: (a.resonance || 0) > 10,
                isVerified: a.isVerified ?? false,
                artist: artistNames,
                src: r.value || "",
                format: r.value?.includes('.m3u8') ? "HLS" : "LOSSLESS",
                bitrate: "1411 KBPS",
            };
        });

    return (
        <BackAlleyBrowser initialArtifacts={formattedArtifacts} />
    );
}
