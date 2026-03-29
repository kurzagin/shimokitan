
'use server';

import { getDb, schema, eq, sql } from '@shimokitan/db';
import { revalidatePath } from 'next/cache';
import { zineSchema, nanoid } from '@shimokitan/utils';
import { ensureUserSync } from '../../(pedalboard)/pedalboard/auth-helpers';

/**
 * Public action for residents to broadcast echoes (zines).
 */
export async function broadcastZineAction(data: { artifactId: string; exhibitId?: string; content: string }) {
    const user = await ensureUserSync();
    if (!user) throw new Error('Unauthorized_Signal: Identity_Lost');

    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const zineId = nanoid();
    // resonanceMultiplier is numeric (string from DB), convert to number for logic
    const userMultiplier = parseFloat((user as any).resonanceMultiplier || "1.0000");
    const baseEnergy = 1.0; // Constant for a single Zine creation
    const initialResonance = userMultiplier * baseEnergy;

    await db.transaction(async (tx) => {
        // Fetch artifact to get parent Work and determine ratio
        const artifact = await tx.query.artifacts.findFirst({
            where: eq(schema.artifacts.id, data.artifactId),
            columns: {
                id: true,
                workId: true,
                nature: true,
                animeType: true,
            }
        });

        if (!artifact) throw new Error('Fragment_Lost: Artifact_Missing');

        await tx.insert(schema.zines).values({
            id: zineId,
            artifactId: data.artifactId,
            exhibitId: data.exhibitId,
            authorId: user.id,
            resonance: initialResonance.toFixed(4),
        });

        await tx.insert(schema.zinesI18n).values({
            zineId,
            locale: 'en',
            content: data.content,
        });

        // 1. Update Artifact Resonance (100% of the Zine's heat)
        if (initialResonance > 0) {
            await tx.update(schema.artifacts)
                .set({ resonance: sql`${schema.artifacts.resonance} + ${initialResonance.toFixed(4)}` })
                .where(eq(schema.artifacts.id, data.artifactId));
        }

        // 2. Bubble resonance to parent Work based on ratio
        if (initialResonance > 0 && artifact.workId) {
            const ratio = getResonanceRatio(artifact);
            const bubbledHeat = initialResonance * ratio;

            if (bubbledHeat > 0) {
                await tx.update(schema.works)
                    .set({ resonance: sql`${schema.works.resonance} + ${bubbledHeat.toFixed(4)}` })
                    .where(eq(schema.works.id, artifact.workId));
            }
        }
    });

    revalidatePath(`/[locale]/cinema/${data.artifactId}`, 'page');
    revalidatePath(`/[locale]/cinema`, 'page');
    revalidatePath(`/[locale]`, 'layout');
    revalidatePath(`/[locale]/cinema/${data.artifactId}/zines`, 'page');
    
    return { success: true, id: zineId };
}

/**
 * Determine the resonance transfer ratio based on the content hierarchy.
 * Fragment (Promo/Clips) = 1.0 (Serves the parent)
 * Interpretation (Covers) = 0.5 (Shared resonance)
 * Tribute (Secondary)     = 0.2 (Individual focus)
 */
function getResonanceRatio(artifact: { nature: string, animeType?: string | null }) {
    // Fragments: Anime promotional materials
    if (artifact.animeType && ['trailer', 'pv', 'mv', 'op', 'ed'].includes(artifact.animeType)) {
        return 1.0;
    }

    // Interpretations: Covers
    if (artifact.nature === 'cover') {
        return 0.5;
    }

    // Tributes: Live performances, collections, or generic tributes
    if (artifact.nature === 'live' || artifact.nature === 'compilation') {
        return 0.2;
    }

    // Originals (Primary manifestations)
    return 1.0;
}

