"use server"

import { getDb, schema, eq, ilike, or } from '@shimokitan/db';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';
import { slugify } from '@shimokitan/utils';
import { workSchema } from '@shimokitan/utils';
import { z } from 'zod';
import { requireFounder, requireArchitect, requireUser } from '../auth-helpers';

export async function searchWorks(query: string) {
    const db = getDb();
    if (!db) return [];

    const results = await db.query.works.findMany({
        where: (w, { isNull }) => isNull(w.deletedAt),
        with: {
            translations: {
                where: (t, { ilike }) => ilike(t.title, `%${query}%`)
            }
        },
        limit: 10
    });

    return results.map(w => ({
        id: w.id,
        title: w.translations?.[0]?.title || 'Untitled Work',
        category: w.category || 'unknown'
    }));
}

export async function createFullWork(data: z.infer<typeof workSchema>) {
    await requireArchitect();
    const validated = workSchema.parse(data);

    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const workId = nanoid();
    const slug = validated.slug || slugify(validated.translations?.[0]?.title || workId);

    await db.transaction(async (tx) => {
        await tx.insert(schema.works).values({
            id: workId,
            category: validated.category,
            nature: validated.nature,
            status: validated.status,
            slug,
            thumbnailId: validated.thumbnailId || null,
            posterId: validated.posterId || null,
            specs: validated.specs || {},
        });

        if (validated.translations?.length) {
            await tx.insert(schema.worksI18n).values(
                validated.translations.map((t) => ({
                    workId,
                    locale: t.locale,
                    title: t.title || '',
                    description: t.description,
                }))
            );
        }

        if (validated.credits?.length) {
            await tx.insert(schema.workCredits).values(
                validated.credits.map((c) => ({
                    id: nanoid(),
                    workId,
                    entityId: c.entityId,
                    role: c.role,
                    contributorClass: c.contributorClass,
                    isPrimary: c.isPrimary,
                    position: c.position,
                }))
            );
        }

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
                        const newTagId = nanoid();
                        await tx.insert(schema.tags).values({ id: newTagId, category: 'other' });
                        await tx.insert(schema.tagsI18n).values({ tagId: newTagId, locale: 'en', name: t.name });
                        tagId = newTagId;
                    }
                }
                await tx.insert(schema.workTags).values({ workId, tagId });
            }
        }

        if (validated.thumbnailId) {
            await tx.update(schema.media).set({ isOrphan: false }).where(eq(schema.media.id, validated.thumbnailId));
        }
    });

    revalidatePath('/[locale]/works', 'page');
    revalidatePath('/[locale]/', 'layout');
    return { id: workId };
}

export async function updateFullWork(id: string, data: z.infer<typeof workSchema>) {
    await requireArchitect();
    const validated = workSchema.parse(data);
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    await db.transaction(async (tx) => {
        const updateData: any = {
            category: validated.category,
            nature: validated.nature,
            status: validated.status,
            thumbnailId: validated.thumbnailId || null,
            posterId: validated.posterId || null,
            specs: validated.specs || {},
            updatedAt: new Date(),
        };

        if (validated.slug) {
            updateData.slug = validated.slug;
        }

        await tx.update(schema.works)
            .set(updateData)
            .where(eq(schema.works.id, id));

        // Re-sync Translations
        await tx.delete(schema.worksI18n).where(eq(schema.worksI18n.workId, id));
        if (validated.translations?.length) {
            await tx.insert(schema.worksI18n).values(
                validated.translations.map((t) => ({
                    workId: id,
                    locale: t.locale,
                    title: t.title || '',
                    description: t.description,
                }))
            );
        }

        // Re-sync Credits
        await tx.delete(schema.workCredits).where(eq(schema.workCredits.workId, id));
        if (validated.credits?.length) {
            await tx.insert(schema.workCredits).values(
                validated.credits.map((c) => ({
                    id: nanoid(),
                    workId: id,
                    entityId: c.entityId,
                    role: c.role,
                    contributorClass: c.contributorClass,
                    isPrimary: c.isPrimary,
                    position: c.position,
                }))
            );
        }

        // Re-sync Tags
        await tx.delete(schema.workTags).where(eq(schema.workTags.workId, id));
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
                        const newTagId = nanoid();
                        await tx.insert(schema.tags).values({ id: newTagId, category: 'other' });
                        await tx.insert(schema.tagsI18n).values({ tagId: newTagId, locale: 'en', name: t.name });
                        tagId = newTagId;
                    }
                }
                await tx.insert(schema.workTags).values({ workId: id, tagId });
            }
        }

        if (validated.thumbnailId) {
            await tx.update(schema.media).set({ isOrphan: false }).where(eq(schema.media.id, validated.thumbnailId));
        }
    });

    revalidatePath('/[locale]/works', 'page');
    revalidatePath('/[locale]/', 'layout');
    return { success: true };
}

export async function deleteWork(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.update(schema.works).set({ deletedAt: new Date() }).where(eq(schema.works.id, id));
    revalidatePath('/[locale]/works', 'page');
}

export async function restoreWork(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.update(schema.works).set({ deletedAt: null }).where(eq(schema.works.id, id));
    revalidatePath('/[locale]/works', 'page');
}

export async function purgeWork(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.delete(schema.works).where(eq(schema.works.id, id));
    revalidatePath('/[locale]/works', 'page');
}
