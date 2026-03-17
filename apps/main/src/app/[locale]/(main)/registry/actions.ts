'use server';

import { getDb, schema, and, gte, eq } from '@shimokitan/db';
import { headers } from 'next/headers';
import { nanoid, registryApplicationSchema } from '@shimokitan/utils';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

/**
 * Handles the submission of a new artist registry application.
 * Implements IP-based rate limiting (1 submission per 24h per IP).
 * 
 * @param data - The artist application data validated by registryApplicationSchema
 * @returns Object including success status and Reference ID or error code
 */
export async function submitRegistryApplication(data: z.infer<typeof registryApplicationSchema>) {
    try {
        const validated = registryApplicationSchema.parse(data);
        const db = getDb();
        if (!db) return { success: false, error: 'DB_Terminal_Offline' };

        // 1. Extract IP for rate limiting
        const headerList = await headers();
        const ip = headerList.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

        // 2. IP Rate Limit Check (24 hour window)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existing = await db.query.registryApplications.findFirst({
            where: and(
                eq(schema.registryApplications.ipAddress, ip),
                gte(schema.registryApplications.createdAt, dayAgo)
            )
        });

        if (existing) {
            return { 
                success: false, 
                error: 'RATE_LIMIT_EXCEEDED' 
            };
        }

        // 3. Create Registry Record
        const id = nanoid();
        await db.insert(schema.registryApplications).values({
            id,
            contactEmail: validated.contactEmail,
            artistMetadata: validated.artistMetadata,
            socialLinks: validated.socialLinks,
            artifactSamples: validated.artifactSamples,
            ipAddress: ip,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // revalidatePath('/[locale]/pedalboard/verifications', 'layout'); // Update admin dashboards
        // revalidatePath('/[locale]/pedalboard/verifications/registry', 'page');
        
        return { 
            success: true, 
            data: { id }
        };
    } catch (error) {
        console.error('Submission failed:', error);
        if (error instanceof z.ZodError) {
            return { success: false, error: 'VALIDATION_FAILED', details: error.issues };
        }
        return { success: false, error: 'INTERNAL_ERROR' };
    }
}
