import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getEntityBySlug, resolveTranslation, getDb } from '@shimokitan/db';
import { getDictionary, Locale } from '@shimokitan/utils';
import { EntityProfileTerminal } from '@/components/entities/EntityProfileTerminal';

import type { Metadata } from 'next';

export async function generateMetadata(props: { params: Promise<{ locale: string, slug: string }> }): Promise<Metadata> {
    const { locale, slug: rawSlug } = await props.params;
    const slug = decodeURIComponent(rawSlug).replace(/^@/, '');
    
    const entity = await getEntityBySlug(slug);
    
    const dict = getDictionary(locale as Locale);
    const s = dict.common.seo;

    // CONSENT FIRST: Only residents have a public profile surface area.
    if (!entity || entity.civilStatus !== 'resident') return { title: s.entity_not_found };

    const translation = resolveTranslation(entity.translations, locale);
    const name = translation?.name || (entity as any).name || s.entity_anonymous;
    const status = translation?.status || entity.type || "Resident";
    const description = s.entity_description
        .replace('{name}', name)
        .replace('{status}', status);

    return {
        title: name,
        description: description,
        alternates: {
            languages: {
                'en': `/en/${entity.slug}`,
                'ja': `/ja/${entity.slug}`,
                'id': `/id/${entity.slug}`,
            }
        },
        openGraph: {
            title: name,
            description: description,
            images: [
                {
                    url: entity.avatar?.url || "/tokyo.jpg",
                    alt: name
                }
            ],
            type: "profile"
        },
        twitter: {
            card: "summary",
            title: name,
            description: description,
            images: [entity.avatar?.url || "/tokyo.jpg"]
        }
    };
}

export default async function EntityProfilePage(props: { params: Promise<{ locale: string, slug: string }> }) {
    const { locale, slug: rawSlug } = await props.params;
    const dict = getDictionary(locale as Locale);

    const decodedSlug = decodeURIComponent(rawSlug);
    
    // Legacy support for @ links — redirect to clean version
    if (decodedSlug.startsWith('@')) {
        redirect(`/${locale}/${decodedSlug.slice(1)}`);
    }
    
    const slug = decodedSlug;

    let entity: any = null;
    let platforms: any[] = [];

    try {
        entity = await getEntityBySlug(slug);
        const db = getDb();
        platforms = db ? await db.query.externalPlatforms.findMany() : [];
    } catch (error) {
        console.error(`SCANNER_ERROR: Failed to retrieve data for entity ${slug}.`);
    }

    // Since this is a catch-all at the root level, we only show it if the entity exists.
    // If not found, we let Next.js throw a 404.
    // CONSENT FIRST: Only residents have a public surface area.
    if (!entity || entity.civilStatus !== 'resident') {
        notFound();
    }

    const translation = resolveTranslation(entity.translations, locale);
    const name = translation?.name || entity.name || "Anonymous Resident";
    
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": entity.type === 'independent' ? 'Person' : 'Organization',
        "name": name,
        "description": translation?.bio || `Registry Profile: ${name}. Data resonance active.`,
        "image": entity.avatar?.url || "",
        "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://shimokitan.live'}/${locale}/${entity.slug}`,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <EntityProfileTerminal entity={entity} locale={locale} dict={dict} platforms={platforms} />
        </>
    );
}
