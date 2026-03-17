
'use server';

import { getDb, schema, eq } from '@shimokitan/db';
import { revalidatePath } from 'next/cache';
import { slugify, nanoid, artifactSchema } from '@shimokitan/utils';
import { z } from 'zod';
import { uploadImageFromUrl } from '@/lib/r2';
import { requireArchitect, requireFounder, requireUser } from '../auth-helpers';


export async function createFullArtifact(data: z.infer<typeof artifactSchema>) {
    await requireArchitect();
    const validated = artifactSchema.parse(data);
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const artifactId = validated.id || nanoid();
    const slug = slugify(validated.translations?.[0]?.title || artifactId);



    await db.transaction(async (tx) => {
        await tx.insert(schema.artifacts).values({
            id: artifactId,
            category: validated.category,
            nature: validated.nature,
            sourceArtifactId: validated.sourceArtifactId,
            animeType: validated.animeType,
            isHosted: validated.isHosted,
            slug,
            status: validated.status,
            resonance: "0", // Initial resonance is always 0 until Zines are written
            specs: validated.specs || {},
            isVerified: false, // Verification is a separate administrative event
            thumbnailId: validated.thumbnailId || null,
            posterId: validated.posterId || null,
            vinylId: validated.vinylId || null,
            workId: validated.workId || null,
        });

        // Bridge Table Sync
        const mediaLinks = [];
        if (validated.thumbnailId) mediaLinks.push({ artifactId, mediaId: validated.thumbnailId, role: 'cover' as any, isPrimary: true });
        if (validated.posterId) mediaLinks.push({ artifactId, mediaId: validated.posterId, role: 'poster' as any, isPrimary: false });
        if (validated.vinylId) mediaLinks.push({ artifactId, mediaId: validated.vinylId, role: 'vinyl' as any, isPrimary: false });

        if (mediaLinks.length) {
            await tx.insert(schema.artifactMedia).values(mediaLinks);
            for (const link of mediaLinks) {
                await tx.update(schema.media).set({ isOrphan: false }).where(eq(schema.media.id, link.mediaId));
            }
        }


        if (validated.verificationId) {
            await tx.update(schema.verificationRegistry)
                .set({
                    targetId: artifactId,
                    targetType: 'artifact',
                    updatedAt: new Date()
                })
                .where(eq(schema.verificationRegistry.id, validated.verificationId));
        }

        if (validated.translations?.length) {
            await tx.insert(schema.artifactsI18n).values(
                validated.translations.map((t) => ({
                    artifactId,
                    locale: t.locale,
                    title: t.title || '',
                    description: t.description,
                }))
            );
        }

        if (validated.resources?.length) {
            await tx.insert(schema.artifactResources).values(
                validated.resources.map((r) => ({
                    id: nanoid(),
                    artifactId,
                    platform: r.platform as any,
                    role: r.role as any,
                    value: r.url,
                    isPrimary: r.isPrimary,
                }))
            );
        }

        if (validated.credits?.length) {
            await tx.insert(schema.artifactCredits).values(
                validated.credits.map((c) => ({
                    id: nanoid(),
                    artifactId,
                    entityId: c.entityId,
                    role: c.role,
                    displayRole: c.displayRole,
                    contributorClass: c.contributorClass,
                    isPrimary: c.isPrimary,
                    position: c.position,
                    isOriginalArtist: c.isOriginalArtist || false,
                }))
            );
        }

        if (validated.tags?.length) {
            for (const tagObj of validated.tags) {
                const tagName = tagObj.name;
                let tag = await tx.query.tags.findFirst({
                    where: (tags, { exists, and, eq }) => exists(
                        tx.select().from(schema.tagsI18n).where(and(
                            eq(schema.tagsI18n.tagId, tags.id),
                            eq(schema.tagsI18n.name, tagName)
                        ))
                    )
                });

                if (!tag) {
                    const newTagId = nanoid();
                    await tx.insert(schema.tags).values({ id: newTagId, category: 'other' });
                    await tx.insert(schema.tagsI18n).values({ tagId: newTagId, locale: 'en', name: tagName });
                    tag = { id: newTagId } as any;
                }

                await tx.insert(schema.artifactTags).values({ artifactId, tagId: tag!.id });
            }
        }

        if (validated.exhibits?.length) {
            for (const ex of validated.exhibits) {
                const exhibitId = nanoid();
                await tx.insert(schema.exhibits).values({
                    id: exhibitId,
                    artifactId,
                    type: ex.type,
                    url: ex.url,
                    mediaId: ex.mediaId,
                });
                if (ex.translations?.length) {
                    await tx.insert(schema.exhibitsI18n).values(
                        ex.translations.map(t => ({
                            exhibitId,
                            locale: t.locale,
                            title: t.title || '',
                            description: t.description,
                        }))
                    );
                }
            }
        }
    });

    revalidatePath('/[locale]/artifacts', 'layout');
    revalidatePath('/[locale]/artifacts', 'layout');
    revalidatePath('/', 'layout');
    return { id: artifactId };
}

export async function updateFullArtifact(id: string, data: z.infer<typeof artifactSchema>) {
    await requireArchitect();
    console.log('[DEBUG] Update Request for ID:', id);
    console.log('[DEBUG] Raw Data Credits:', data.credits?.length);
    
    const validated = artifactSchema.parse(data);
    console.log('[DEBUG] Validated Credits:', JSON.stringify(validated.credits, null, 2));
    
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');



    await db.transaction(async (tx) => {
        await tx.update(schema.artifacts)
            .set({
                category: validated.category,
                nature: validated.nature,
                sourceArtifactId: validated.sourceArtifactId,
                animeType: validated.animeType,
                isHosted: validated.isHosted,
                thumbnailId: validated.thumbnailId,
                posterId: validated.posterId,
                vinylId: validated.vinylId,
                status: validated.status,
                specs: validated.specs,
                workId: validated.workId,
                updatedAt: new Date(),
            })
            .where(eq(schema.artifacts.id, id));

        // Check for manual credits metadata updates
        if (validated.nature === 'original' || validated.nature === 'compilation') {
            await tx.delete(schema.externalOriginals).where(eq(schema.externalOriginals.artifactId, id));
        }

        // Bridge Table Sync (Delete and Re-insert for active roles)
        await tx.delete(schema.artifactMedia).where(eq(schema.artifactMedia.artifactId, id));
        const mediaLinks = [];
        if (validated.thumbnailId) mediaLinks.push({ artifactId: id, mediaId: validated.thumbnailId, role: 'cover' as any, isPrimary: true });
        if (validated.posterId) mediaLinks.push({ artifactId: id, mediaId: validated.posterId, role: 'poster' as any, isPrimary: false });
        if (validated.vinylId) mediaLinks.push({ artifactId: id, mediaId: validated.vinylId, role: 'vinyl' as any, isPrimary: false });

        if (mediaLinks.length) {
            await tx.insert(schema.artifactMedia).values(mediaLinks);
            for (const link of mediaLinks) {
                await tx.update(schema.media).set({ isOrphan: false }).where(eq(schema.media.id, link.mediaId));
            }
        }


        // Re-sync Translations
        await tx.delete(schema.artifactsI18n).where(eq(schema.artifactsI18n.artifactId, id));
        if (validated.translations?.length) {
            await tx.insert(schema.artifactsI18n).values(
                validated.translations.map((t) => ({
                    artifactId: id,
                    locale: t.locale,
                    title: t.title!,
                    description: t.description,
                }))
            );
        }

        // Re-sync Resources
        await tx.delete(schema.artifactResources).where(eq(schema.artifactResources.artifactId, id));
        if (validated.resources?.length) {
            await tx.insert(schema.artifactResources).values(
                validated.resources.map((r) => ({
                    id: nanoid(),
                    artifactId: id,
                    platform: r.platform as any,
                    value: r.url,
                    role: r.role as any,
                    isPrimary: r.isPrimary,
                }))
            );
        }

        // Re-sync Credits
        await tx.delete(schema.artifactCredits).where(eq(schema.artifactCredits.artifactId, id));
        if (validated.credits?.length) {
            await tx.insert(schema.artifactCredits).values(
                validated.credits.map((c) => ({
                    id: nanoid(),
                    artifactId: id,
                    entityId: c.entityId,
                    role: c.role,
                    displayRole: c.displayRole,
                    contributorClass: c.contributorClass,
                    isPrimary: c.isPrimary,
                    isOriginalArtist: c.isOriginalArtist || false,
                    position: c.position,
                }))
            );
        }

        // Re-sync Tags
        await tx.delete(schema.artifactTags).where(eq(schema.artifactTags.artifactId, id));
        if (validated.tags?.length) {
            for (const t of validated.tags) {
                let tagId = (t as any).id;

                if (!tagId) {
                    const tagResult = await tx.query.tags.findFirst({
                        where: (tags, { exists, and, eq }) => exists(
                            tx.select().from(schema.tagsI18n).where(and(
                                eq(schema.tagsI18n.tagId, tags.id),
                                eq(schema.tagsI18n.name, t.name)
                            ))
                        )
                    });
                    
                    if (tagResult) {
                        tagId = tagResult.id;
                    } else {
                        // Create new tag if not found
                        const newTagId = nanoid();
                        await tx.insert(schema.tags).values({ id: newTagId, category: 'other' });
                        await tx.insert(schema.tagsI18n).values({ tagId: newTagId, locale: 'en', name: t.name });
                        tagId = newTagId;
                    }
                }

                if (tagId) {
                    await tx.insert(schema.artifactTags).values({ artifactId: id, tagId });
                }
            }
        }

        // Re-sync Exhibits
        await tx.delete(schema.exhibits).where(eq(schema.exhibits.artifactId, id));
        if (validated.exhibits?.length) {
            for (const ex of validated.exhibits) {
                const exhibitId = nanoid();
                await tx.insert(schema.exhibits).values({
                    id: exhibitId,
                    artifactId: id,
                    type: ex.type,
                    url: ex.url,
                    mediaId: ex.mediaId,
                });
                if (ex.translations?.length) {
                    await tx.insert(schema.exhibitsI18n).values(
                        ex.translations.map(t => ({
                            exhibitId,
                            locale: t.locale,
                            title: t.title || '',
                            description: t.description,
                        }))
                    );
                }
            }
        }
    });

    console.log('[DEBUG] Update Successful for ID:', id);

    revalidatePath('/[locale]/artifacts', 'layout');
    revalidatePath('/[locale]/artifacts', 'layout');
    revalidatePath(`/[locale]/artifacts/${id}`, 'layout');
    revalidatePath('/', 'layout');
    return { success: true, id };
}

export async function deleteArtifact(id: string) {
    await requireArchitect();
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    await db.update(schema.artifacts)
        .set({ deletedAt: new Date() })
        .where(eq(schema.artifacts.id, id));

    revalidatePath('/[locale]/artifacts', 'layout');
    revalidatePath('/[locale]/artifacts', 'layout');
    revalidatePath('/', 'layout');
    return { success: true };
}

export async function restoreArtifact(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.update(schema.artifacts).set({ deletedAt: null }).where(eq(schema.artifacts.id, id));
    revalidatePath('/[locale]/artifacts', 'layout');
    revalidatePath('/', 'layout');
}

export async function purgeArtifact(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.delete(schema.artifacts).where(eq(schema.artifacts.id, id));
    revalidatePath('/[locale]/artifacts', 'layout');
    revalidatePath('/', 'layout');
}

export async function searchArtifacts(query: string) {
    await requireUser();
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const results = await db.query.artifacts.findMany({
        where: (a, { and, ilike, exists, isNull }) => {
            const conditions = [isNull(a.deletedAt)];
            
            conditions.push(exists(
                db.select().from(schema.artifactsI18n)
                    .where(and(
                        eq(schema.artifactsI18n.artifactId, a.id),
                        ilike(schema.artifactsI18n.title, `%${query}%`)
                    ))
            ));

            return and(...conditions);
        },
        with: {
            translations: true as any
        },
        limit: 10
    });

    return results.map(a => ({
        id: a.id,
        title: (a as any).translations?.find((t: any) => t.locale === 'en')?.title || (a as any).translations?.[0]?.title || 'Unknown_Artifact',
        category: a.category,
    }));
}

