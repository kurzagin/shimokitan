'use server';

import { getDb, schema, eq, sql, desc, or, ilike } from '@shimokitan/db';
import { nanoid } from '@shimokitan/utils';
import { revalidatePath } from 'next/cache';
import { slugify, generateStoragePath } from '@shimokitan/utils';
import {
    entitySchema,
    artifactSchema,
    collectionSchema,
    zineSchema,
    tagSchema,
    verificationSchema
} from '@shimokitan/utils';
import { z } from 'zod';
import { uploadFileToR2, uploadImageFromUrl } from '@/lib/r2';
import { requireUser, requireArchitect, requireFounder, ensureUserSync } from './auth-helpers';


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

    revalidatePath('/[locale]/', 'page');
    return { success: true, message: 'Signal_Sent_To_Founders' };
}

export async function approveRoleUpgrade(verificationId: string) {
    const user = await requireFounder();
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const request = await db.query.verificationRegistry.findFirst({
        where: eq(schema.verificationRegistry.id, verificationId)
    });

    if (!request || request.targetType !== 'role_upgrade') {
        throw new Error('Invalid_Request_Record');
    }

    await db.transaction(async (tx) => {
        const entityId = nanoid();

        await tx.update(schema.verificationRegistry)
            .set({
                status: 'approved',
                grantedBy: user.name || 'Architect_Oversight',
                updatedAt: new Date()
            })
            .where(eq(schema.verificationRegistry.id, verificationId));

        await tx.update(schema.users)
            .set({
                role: 'architect',
                updatedAt: new Date()
            })
            .where(eq(schema.users.id, request.targetId));

        // Create Entity for the new Architect
        const creator = await tx.query.users.findFirst({
            where: eq(schema.users.id, request.targetId)
        });

        await tx.insert(schema.entities).values({
            id: entityId,
            type: 'independent',
            slug: slugify(creator?.name || `architect-${nanoid()}`),
        });

        if (creator?.name) {
            await tx.insert(schema.entitiesI18n).values({
                entityId,
                locale: 'en',
                name: creator.name,
            });
        }

        // Link User to Entity as Owner
        await tx.insert(schema.entityManagers).values({
            userId: request.targetId,
            entityId,
            role: 'owner',
        });
    });

    revalidatePath('/[locale]/', 'layout');
    revalidatePath('/[locale]/verifications', 'page');
    return { success: true };
}

// --- ENTITIES (Founder Only) ---

export async function createFullEntity(data: z.infer<typeof entitySchema>) {
    await requireFounder();
    const validated = entitySchema.parse(data);

    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const entityId = nanoid();

    const slug = validated.slug || slugify(validated.translations?.[0]?.name || entityId);

    await db.transaction(async (tx) => {
        await tx.insert(schema.entities).values({
            id: entityId,
            type: validated.type,
            slug,
            uid: validated.uid,
            civilStatus: validated.civilStatus,
            socialLinks: validated.socialLinks ? JSON.stringify(validated.socialLinks) : '[]',
            avatarId: validated.avatarId || null,
            thumbnailId: validated.thumbnailId || null,
        });

        if (validated.avatarId) {
            await tx.update(schema.media).set({ isOrphan: false }).where(eq(schema.media.id, validated.avatarId));
        }
        if (validated.thumbnailId) {
            await tx.update(schema.media).set({ isOrphan: false }).where(eq(schema.media.id, validated.thumbnailId));
        }

        if (validated.translations?.length) {
            await tx.insert(schema.entitiesI18n).values(
                validated.translations.map((t) => ({
                    entityId,
                    locale: t.locale,
                    name: t.name || '',
                    status: t.status,
                    bio: t.bio,
                }))
            );
        }

        if (validated.type === 'circle' && validated.members?.length) {
            await tx.insert(schema.unitMembers).values(
                validated.members.map((m) => ({
                    unitId: entityId,
                    memberId: m.memberId,
                    memberRole: m.memberRole,
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
                    await tx.insert(schema.tags).values({ id: newTagId, category: 'identity' });
                    await tx.insert(schema.tagsI18n).values({ tagId: newTagId, locale: 'en', name: tagName });
                    tag = { id: newTagId } as any;
                }

                await tx.insert(schema.entityTags).values({ entityId, tagId: tag!.id });
            }
        }
    });

    revalidatePath('/[locale]/entities', 'page');
    return { id: entityId };
}

export async function searchEntities(query: string, type?: string) {
    await requireUser();
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const results = await db.query.entities.findMany({
        where: (e, { and, eq, ilike, exists }) => {
            const conditions = [];
            if (type) conditions.push(eq(e.type, type as any));

            // Search in translations
            conditions.push(exists(
                db.select().from(schema.entitiesI18n)
                    .where(and(
                        eq(schema.entitiesI18n.entityId, e.id),
                        ilike(schema.entitiesI18n.name, `%${query}%`)
                    ))
            ));

            return and(...conditions);
        },
        with: {
            translations: true
        },
        limit: 10
    });

    return results.map(e => ({
        id: e.id,
        name: e.translations.find(t => t.locale === 'en')?.name || e.translations[0]?.name || 'Unknown_Entity',
        type: e.type,
        slug: e.slug,
    }));
}

export async function quickCreateEntity(name: string, type: string) {
    await requireArchitect(); // On-the-fly creation requires at least Architect
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const entityId = nanoid();
    const slug = entityId; // Use ID as slug for initial registration to ensure absolute encryption (no name leakage in URL)

    await db.transaction(async (tx) => {
        await tx.insert(schema.entities).values({
            id: entityId,
            type: type as any,
            slug,
            civilStatus: 'sealed', // Consent-first: All quick registrations start as Sealed fragments
        });

        await tx.insert(schema.entitiesI18n).values({
            entityId,
            locale: 'en',
            name: name,
        });
    });

    revalidatePath('/[locale]/entities', 'page');
    return { id: entityId, name };
}

export async function updateFullEntity(id: string, data: z.infer<typeof entitySchema>) {
    await requireFounder();
    const validated = entitySchema.parse(data);
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    await db.transaction(async (tx) => {
        const updateData: any = {
            type: validated.type,
            uid: validated.uid,
            civilStatus: validated.civilStatus,
            socialLinks: validated.socialLinks ? JSON.stringify(validated.socialLinks) : '[]',
            avatarId: validated.avatarId || null,
            thumbnailId: validated.thumbnailId || null,
            updatedAt: new Date(),
        };

        if (validated.slug) {
            updateData.slug = validated.slug;
        }

        await tx.update(schema.entities)
            .set(updateData)
            .where(eq(schema.entities.id, id));

        if (validated.avatarId) {
            await tx.update(schema.media).set({ isOrphan: false }).where(eq(schema.media.id, validated.avatarId));
        }
        if (validated.thumbnailId) {
            await tx.update(schema.media).set({ isOrphan: false }).where(eq(schema.media.id, validated.thumbnailId));
        }

        await tx.delete(schema.entitiesI18n).where(eq(schema.entitiesI18n.entityId, id));

        if (validated.translations?.length) {
            await tx.insert(schema.entitiesI18n).values(
                validated.translations.map((t) => ({
                    entityId: id,
                    locale: t.locale,
                    name: t.name || '',
                    status: t.status,
                    bio: t.bio,
                }))
            );
        }

        // --- Sync Unit Members ---
        await tx.delete(schema.unitMembers).where(eq(schema.unitMembers.unitId, id));
        if (validated.type === 'circle' && validated.members?.length) {
            await tx.insert(schema.unitMembers).values(
                validated.members.map((m) => ({
                    unitId: id,
                    memberId: m.memberId,
                    memberRole: m.memberRole,
                }))
            );
        }

        // --- Sync Entity Tags ---
        await tx.delete(schema.entityTags).where(eq(schema.entityTags.entityId, id));
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
                    await tx.insert(schema.tags).values({ id: newTagId, category: 'identity' });
                    await tx.insert(schema.tagsI18n).values({ tagId: newTagId, locale: 'en', name: tagName });
                    tag = { id: newTagId } as any;
                }

                await tx.insert(schema.entityTags).values({ entityId: id, tagId: tag!.id });
            }
        }
    });

    revalidatePath('/[locale]/entities', 'page');
    return { success: true };
}

// --- ARTIFACTS (Moved to actions/artifacts.ts) ---

// --- COLLECTIONS (Founder Only) ---

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
                    thesis: t.thesis || t.description,
                }))
            );
        }
    });

    revalidatePath('/[locale]/collections', 'page');
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
                    thesis: t.thesis || t.description,
                }))
            );
        }
    });

    revalidatePath('/[locale]/collections', 'page');
    return { success: true };
}

// --- ZINES (Architect+) ---

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
            authorId: validated.authorId,
            resonance: initialResonance,
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

    revalidatePath('/[locale]/zines', 'page');
    revalidatePath(`/[locale]/artifacts/${validated.artifactId}`, 'page');
    revalidatePath(`/[locale]/artifacts`, 'page');
    revalidatePath(`/[locale]`, 'layout');
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
                authorId: validated.authorId,
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

    revalidatePath('/[locale]/zines', 'page');
    return { success: true };
}

// --- TAGS (Founder Only) ---

export async function createFullTag(data: z.infer<typeof tagSchema>) {
    await requireFounder();
    const validated = tagSchema.parse(data);
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const tagId = nanoid();

    await db.transaction(async (tx) => {
        await tx.insert(schema.tags).values({
            id: tagId,
            category: validated.category,
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

    revalidatePath('/[locale]/tags', 'page');
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
                category: validated.category,
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

    revalidatePath('/[locale]/tags', 'page');
    return { success: true };
}

// --- VERIFICATIONS (Founder Only) ---

export async function createVerification(data: z.infer<typeof verificationSchema>) {
    await requireFounder();
    const validated = verificationSchema.parse(data);
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const verificationId = nanoid();

    await db.insert(schema.verificationRegistry).values({
        id: verificationId,
        targetId: validated.targetId,
        targetType: validated.targetType,
        status: validated.status,
        issuer: validated.issuer,
        r2Key: validated.r2Key,
        grantedBy: validated.grantedBy,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined,
        internalNotes: validated.internalNotes,
    });

    revalidatePath('/[locale]/verifications', 'page');
    return { id: verificationId };
}

export async function updateVerification(id: string, data: z.infer<typeof verificationSchema>) {
    await requireFounder();
    const validated = verificationSchema.parse(data);
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    await db.update(schema.verificationRegistry)
        .set({
            targetId: validated.targetId,
            targetType: validated.targetType,
            status: validated.status,
            issuer: validated.issuer,
            r2Key: validated.r2Key,
            grantedBy: validated.grantedBy,
            expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined,
            internalNotes: validated.internalNotes,
            updatedAt: new Date(),
        })
        .where(eq(schema.verificationRegistry.id, id));

    revalidatePath('/[locale]/verifications', 'page');
    return { success: true };
}

// --- REGISTRY APPLICATIONS (Founder Only) ---

export async function updateRegistryApplicationStatus(id: string, status: 'pending' | 'reviewed' | 'approved' | 'rejected', notes?: string) {
    await requireFounder();
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    await db.update(schema.registryApplications)
        .set({
            status,
            internalNotes: notes,
            updatedAt: new Date(),
        })
        .where(eq(schema.registryApplications.id, id));

    revalidatePath('/[locale]/verifications/registry', 'page');
    return { success: true };
}

export async function deleteRegistryApplication(id: string) {
    await requireFounder();
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    await db.delete(schema.registryApplications).where(eq(schema.registryApplications.id, id));
    
    revalidatePath('/[locale]/verifications/registry', 'page');
    return { success: true };
}

// --- DELETE ACTIONS (Founder Only) ---

export async function deleteEntity(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.update(schema.entities).set({ deletedAt: new Date() }).where(eq(schema.entities.id, id));
    revalidatePath('/[locale]/entities', 'page');
}


export async function deleteCollection(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.update(schema.collections).set({ deletedAt: new Date() }).where(eq(schema.collections.id, id));
    revalidatePath('/[locale]/collections', 'page');
}

export async function deleteZine(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.update(schema.zines).set({ deletedAt: new Date() }).where(eq(schema.zines.id, id));
    revalidatePath('/[locale]/zines', 'page');
}

export async function purgeEntity(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.delete(schema.entities).where(eq(schema.entities.id, id));
    revalidatePath('/[locale]/entities', 'page');
}


export async function purgeCollection(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.delete(schema.collections).where(eq(schema.collections.id, id));
    revalidatePath('/[locale]/collections', 'page');
}

export async function purgeZine(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.delete(schema.zines).where(eq(schema.zines.id, id));
    revalidatePath('/[locale]/zines', 'page');
}

export async function restoreEntity(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.update(schema.entities).set({ deletedAt: null }).where(eq(schema.entities.id, id));
    revalidatePath('/[locale]/entities', 'page');
}


export async function restoreCollection(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.update(schema.collections).set({ deletedAt: null }).where(eq(schema.collections.id, id));
    revalidatePath('/[locale]/collections', 'page');
}

export async function restoreZine(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.update(schema.zines).set({ deletedAt: null }).where(eq(schema.zines.id, id));
    revalidatePath('/[locale]/zines', 'page');
}

export async function deleteTag(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.delete(schema.tags).where(eq(schema.tags.id, id));
    revalidatePath('/[locale]/tags', 'page');
}

export async function deleteVerification(id: string) {
    await requireFounder();
    const db = getDb();
    if (db) await db.delete(schema.verificationRegistry).where(eq(schema.verificationRegistry.id, id));
    revalidatePath('/[locale]/verifications', 'page');
}

// --- STORAGE & PROFILE (All Users) ---

export async function createIndieVerificationAction(formData: FormData) {
    const user = await requireUser();
    const file = formData.get('file') as File;

    if (!file) throw new Error('SIGNAL_LOST: NO_PROOF_FILE');

    const db = getDb();
    if (!db) throw new Error('SYSTEM_ERROR: DB_STATION_OFFLINE');

    const verificationId = nanoid();
    const extension = file.name.split('.').pop() || 'pdf';

    // Upload Proof to R2
    const key = `verifications/indie/${verificationId}/${nanoid()}.${extension}`;
    const buffer = await file.arrayBuffer();
    const publicUrl = await uploadFileToR2(buffer, key, file.type);

    await db.insert(schema.verificationRegistry).values({
        id: verificationId,
        targetId: 'PENDING_SIGNAL', // Atomic link update happens in createFullArtifact
        targetType: 'artifact',
        status: 'pending',
        issuer: user.id,
        r2Key: key,
        internalNotes: 'AUTO_GENERATED: PROOF_OF_HOSTING_PERMIT',
    });

    return { verificationId, publicUrl };
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

    revalidatePath('/[locale]/', 'page');
    revalidatePath('/[locale]/profile/edit', 'page');
    return { success: true };
}
