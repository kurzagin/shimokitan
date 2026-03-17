'use server';

import { getDb, schema, eq, sql } from '@shimokitan/db';
import { revalidatePath } from 'next/cache';
import { 
    slugify, 
    nanoid,
    generateStoragePath,
    entitySchema, 
    artifactSchema, 
    collectionSchema, 
    tagSchema, 
    verificationSchema,
    zineSchema
} from '@shimokitan/utils';
import { z } from 'zod';
import { requireUser, requireArchitect, requireFounder } from './auth-helpers';
import { uploadFileToR2 } from '@/lib/r2';

// --- SYSTEM ---

export async function requestArchitectAccess() {
    const user = await requireUser();
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const existing = await db.query.verificationRegistry.findFirst({
        where: (vr, { and, eq }) => and(
            eq(vr.targetId, user.id),
            eq(vr.targetType, 'role_upgrade'),
            eq(vr.status, 'pending')
        )
    });

    if (existing) {
        return { success: false, message: 'Request_Already_In_Queue' };
    }

    await db.insert(schema.verificationRegistry).values({
        id: nanoid(),
        targetId: user.id,
        targetType: 'role_upgrade',
        status: 'pending',
        issuer: user.id,
        internalNotes: `Architect promotion request from ${user.email} (${user.name})`,
    });

    revalidatePath('/[locale]/pedalboard', 'page');
    return { success: true, message: 'Signal_Sent_To_Founders' };
}

// --- COLLECTIONS ---

export async function createFullCollection(data: z.infer<typeof collectionSchema>) {
    await requireFounder();
    const validated = collectionSchema.parse(data);
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const collectionId = nanoid();
    const slug = slugify(validated.translations?.[0]?.title || collectionId);

    await db.transaction(async (tx) => {
        await tx.insert(schema.collections).values({
            id: collectionId,
            slug,
            resonance: validated.resonance,
            coverId: validated.coverId || null,
        });

        if (validated.coverId) {
            await tx.update(schema.media).set({ isOrphan: false }).where(eq(schema.media.id, validated.coverId));
        }

        if (validated.translations?.length) {
            await tx.insert(schema.collectionsI18n).values(
                validated.translations.map((t) => ({
                    collectionId,
                    locale: t.locale,
                    title: t.title || '',
                    thesis: t.thesis || t.description || '',
                }))
            );
        }
    });

    revalidatePath('/[locale]/pedalboard/collections', 'page');
    return { id: collectionId };
}

export async function updateFullCollection(id: string, data: z.infer<typeof collectionSchema>) {
    await requireFounder();
    const validated = collectionSchema.parse(data);
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    await db.transaction(async (tx) => {
        await tx.update(schema.collections)
            .set({
                resonance: validated.resonance,
                coverId: validated.coverId || null,
                updatedAt: new Date(),
            })
            .where(eq(schema.collections.id, id));

        if (validated.coverId) {
            await tx.update(schema.media).set({ isOrphan: false }).where(eq(schema.media.id, validated.coverId));
        }

        await tx.delete(schema.collectionsI18n).where(eq(schema.collectionsI18n.collectionId, id));
        if (validated.translations?.length) {
            await tx.insert(schema.collectionsI18n).values(
                validated.translations.map((t) => ({
                    collectionId: id,
                    locale: t.locale,
                    title: t.title || '',
                    thesis: t.thesis || t.description || '',
                }))
            );
        }
    });

    revalidatePath('/[locale]/pedalboard/collections', 'page');
    return { success: true };
}

export async function deleteCollection(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.update(schema.collections).set({ deletedAt: new Date() }).where(eq(schema.collections.id, id));
    revalidatePath('/[locale]/pedalboard/collections', 'page');
}

export async function restoreCollection(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.update(schema.collections).set({ deletedAt: null }).where(eq(schema.collections.id, id));
    revalidatePath('/[locale]/pedalboard/collections', 'page');
}

export async function purgeCollection(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.delete(schema.collections).where(eq(schema.collections.id, id));
    revalidatePath('/[locale]/pedalboard/collections', 'page');
}

// --- PROFILE & STORAGE ---

export async function updateUserProfile(data: { name: string; status: string; bio: string }) {
    const user = await requireUser();
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    await db.update(schema.users)
        .set({
            name: data.name,
            status: data.status,
            bio: data.bio,
            updatedAt: new Date()
        })
        .where(eq(schema.users.id, user.id));

    revalidatePath('/[locale]/pedalboard', 'page');
    revalidatePath('/[locale]/pedalboard/profile/edit', 'page');
    return { success: true };
}

export async function uploadToR2Action(formData: FormData) {
    const user = await requireUser();
    const file = formData.get('file') as File;
    const context = formData.get('context') as 'artifacts' | 'profiles' | 'zines';

    if (!file) throw new Error('No_File_Targeted');

    const fileId = nanoid();
    const buffer = Buffer.from(await file.arrayBuffer() as any);
    const contentType = file.type;
    const extension = file.name.split('.').pop() || 'webp';

    const key = generateStoragePath({
        mediaType: contentType.startsWith('audio/') ? 'audio' : (contentType.startsWith('image/') ? 'images' : 'dumps'),
        context,
        identifier: user.id,
        filename: `${fileId}.${extension}`
    });

    const publicUrl = await uploadFileToR2(buffer, key, contentType);

    return { publicUrl, key };
}

// --- OTHER ENTITY/ARTIFACT ACTIONS (Placeholders or copied as needed) ---

export async function deleteEntity(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.update(schema.entities).set({ deletedAt: new Date() }).where(eq(schema.entities.id, id));
    revalidatePath('/[locale]/pedalboard/entities', 'page');
}

export async function deleteTag(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.update(schema.tags).set({ updatedAt: new Date() }).where(eq(schema.tags.id, id)); // Fixed: Tags usually don't have deletedAt
    revalidatePath('/[locale]/pedalboard/tags', 'page');
}

export async function restoreTag(id: string) {
    // Tags usually don't have deletedAt in schema, but RegistryTable expects these
    return { success: true };
}

export async function purgeTag(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.delete(schema.tags).where(eq(schema.tags.id, id));
    revalidatePath('/[locale]/pedalboard/tags', 'page');
}

export async function createFullTag(data: z.infer<typeof tagSchema>) {
    await requireFounder();
    const validated = tagSchema.parse(data);
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const tagId = nanoid();

    await db.transaction(async (tx) => {
        await tx.insert(schema.tags).values({
            id: tagId,
            category: validated.category as any,
        });

        if (validated.translations?.length) {
            await tx.insert(schema.tagsI18n).values(
                validated.translations.map((t) => ({
                    tagId,
                    locale: t.locale,
                    name: t.name || '',
                }))
            );
        }
    });

    revalidatePath('/[locale]/pedalboard/tags', 'page');
    return { id: tagId };
}

export async function updateFullTag(id: string, data: z.infer<typeof tagSchema>) {
    await requireFounder();
    const validated = tagSchema.parse(data);
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    await db.transaction(async (tx) => {
        await tx.update(schema.tags)
            .set({
                category: validated.category as any,
                updatedAt: new Date(),
            })
            .where(eq(schema.tags.id, id));

        await tx.delete(schema.tagsI18n).where(eq(schema.tagsI18n.tagId, id));
        if (validated.translations?.length) {
            await tx.insert(schema.tagsI18n).values(
                validated.translations.map((t) => ({
                    tagId: id,
                    locale: t.locale,
                    name: t.name || '',
                }))
            );
        }
    });

    revalidatePath('/[locale]/pedalboard/tags', 'page');
    return { success: true };
}

// --- ZINES ---

export async function createFullZine(data: z.infer<typeof zineSchema>) {
    const user = await requireArchitect();
    const validated = zineSchema.parse(data);
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const zineId = nanoid();
    const initialResonance = (user as any).resonanceMultiplier || 0;

    await db.transaction(async (tx) => {
        await tx.insert(schema.zines).values({
            id: zineId,
            artifactId: validated.artifactId,
            authorId: user.id, // Fixed: use current user
            resonance: validated.resonance || initialResonance,
        });

        if (validated.translations?.length) {
            await tx.insert(schema.zinesI18n).values(
                validated.translations.map((t) => ({
                    zineId,
                    locale: t.locale,
                    content: t.content || '',
                }))
            );
        }

        // Update technical artifact resonance - collective weight
        if (initialResonance > 0) {
            await tx.update(schema.artifacts)
                .set({ resonance: sql`${schema.artifacts.resonance} + ${initialResonance}` })
                .where(eq(schema.artifacts.id, validated.artifactId));
        }
    });

    revalidatePath('/[locale]/pedalboard/zines', 'page');
    revalidatePath(`/[locale]/artifacts/${validated.artifactId}`, 'page');
    return { id: zineId };
}

export async function updateFullZine(id: string, data: z.infer<typeof zineSchema>) {
    await requireArchitect();
    const validated = zineSchema.parse(data);
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    await db.transaction(async (tx) => {
        await tx.update(schema.zines)
            .set({
                artifactId: validated.artifactId,
                resonance: validated.resonance,
                updatedAt: new Date(),
            })
            .where(eq(schema.zines.id, id));

        await tx.delete(schema.zinesI18n).where(eq(schema.zinesI18n.zineId, id));
        if (validated.translations?.length) {
            await tx.insert(schema.zinesI18n).values(
                validated.translations.map((t) => ({
                    zineId: id,
                    locale: t.locale,
                    content: t.content || '',
                }))
            );
        }
    });

    revalidatePath('/[locale]/pedalboard/zines', 'page');
    return { success: true };
}

export async function deleteZine(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.update(schema.zines).set({ deletedAt: new Date() }).where(eq(schema.zines.id, id));
    revalidatePath('/[locale]/pedalboard/zines', 'page');
}

export async function restoreZine(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.update(schema.zines).set({ deletedAt: null }).where(eq(schema.zines.id, id));
    revalidatePath('/[locale]/pedalboard/zines', 'page');
}

export async function purgeZine(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.delete(schema.zines).where(eq(schema.zines.id, id));
    revalidatePath('/[locale]/pedalboard/zines', 'page');
}
