
'use server';

import { getDb, schema, eq } from '@shimokitan/db';
import { revalidatePath } from 'next/cache';
import { externalPlatformSchema } from '@shimokitan/utils';
import { z } from 'zod';
import { requireFounder } from '../auth-helpers';

export async function createPlatform(data: z.infer<typeof externalPlatformSchema>) {
    await requireFounder();
    const validated = externalPlatformSchema.parse(data);
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    await db.insert(schema.externalPlatforms).values({
        id: validated.id,
        name: validated.name,
        category: validated.category,
        iconUrl: validated.iconUrl,
        accentColor: validated.accentColor,
        isActive: validated.isActive,
    });

    revalidatePath('/[locale]/governance/platforms', 'page');
    return { success: true };
}

export async function updatePlatform(id: string, data: z.infer<typeof externalPlatformSchema>) {
    await requireFounder();
    const validated = externalPlatformSchema.parse(data);
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    await db.update(schema.externalPlatforms)
        .set({
            name: validated.name,
            category: validated.category,
            iconUrl: validated.iconUrl,
            accentColor: validated.accentColor,
            isActive: validated.isActive,
            updatedAt: new Date(),
        })
        .where(eq(schema.externalPlatforms.id, id));

    revalidatePath('/[locale]/governance/platforms', 'page');
    return { success: true };
}

export async function deletePlatform(id: string) {
    await requireFounder();
    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    await db.delete(schema.externalPlatforms).where(eq(schema.externalPlatforms.id, id));

    revalidatePath('/[locale]/governance/platforms', 'page');
    return { success: true };
}
