'use server';

import { getDb, schema, eq, and, sql } from '@shimokitan/db';
import { revalidatePath } from 'next/cache';
import { nanoid } from '@shimokitan/utils';
import { ensureUserSync } from '@/app/[locale]/(pedalboard)/pedalboard/auth-helpers';

/**
 * Base resonance heat for a single reaction (Pulse Shard/Fuel).
 * 0.05 units (~20 reactions = 1 zine)
 */
const BASE_REACTION_ENERGY = 0.05;

/**
 * Toggles an emotional reaction (Fuel) on an artifact.
 * Injected energy bubbles up to the parent Work resonance.
 */
export async function toggleArtifactReaction(data: { 
    artifactId: string; 
    type: "core" | "flux" | "void" | "glitch" | "spark" | "pulse";
}) {
    const user = await ensureUserSync();
    if (!user) throw new Error('Unauthorized_Signal: Identity_Lost');

    const db = getDb();
    if (!db) throw new Error('DB_Terminal_Offline');

    const userMultiplier = parseFloat((user as any).resonanceMultiplier || "1.0000");
    const resonanceEnergy = userMultiplier * BASE_REACTION_ENERGY;

    return await db.transaction(async (tx) => {
        // Check for existing reaction by this user of this exact type
        const existing = await tx.query.artifactReactions.findFirst({
            where: and(
                eq(schema.artifactReactions.artifactId, data.artifactId),
                eq(schema.artifactReactions.authorId, user.id),
                eq(schema.artifactReactions.type, data.type)
            )
        });

        // ── FETCH ARTIFACT CONTEXT FOR BUBBLING ──
        const artifact = await tx.query.artifacts.findFirst({
            where: eq(schema.artifacts.id, data.artifactId),
            columns: {
                id: true,
                workId: true,
                nature: true,
                category: true,
                animeType: true,
            }
        });

        if (!artifact) throw new Error('Fragment_Lost: Artifact_Missing');

        if (existing) {
            // UNPUMP: Remove reaction and subtract resonance
            await tx.delete(schema.artifactReactions)
                .where(eq(schema.artifactReactions.id, existing.id));

            await tx.update(schema.artifacts)
                .set({ resonance: sql`${schema.artifacts.resonance} - ${resonanceEnergy.toFixed(4)}` })
                .where(eq(schema.artifacts.id, data.artifactId));

            if (artifact.workId) {
                const ratio = getResonanceRatio(artifact);
                const bubbledHeat = resonanceEnergy * ratio;
                await tx.update(schema.works)
                    .set({ resonance: sql`${schema.works.resonance} - ${bubbledHeat.toFixed(4)}` })
                    .where(eq(schema.works.id, artifact.workId));
            }

            revalidateArtifact(data.artifactId, artifact.category);
            return { action: 'removed', id: existing.id };
        } else {
            // PUMP: Add reaction and resonance
            const reactionId = nanoid();
            await tx.insert(schema.artifactReactions).values({
                id: reactionId,
                artifactId: data.artifactId,
                authorId: user.id,
                type: data.type,
                energy: resonanceEnergy.toFixed(4),
            });

            await tx.update(schema.artifacts)
                .set({ resonance: sql`${schema.artifacts.resonance} + ${resonanceEnergy.toFixed(4)}` })
                .where(eq(schema.artifacts.id, data.artifactId));

            if (artifact.workId) {
                const ratio = getResonanceRatio(artifact);
                const bubbledHeat = resonanceEnergy * ratio;
                await tx.update(schema.works)
                    .set({ resonance: sql`${schema.works.resonance} + ${bubbledHeat.toFixed(4)}` })
                    .where(eq(schema.works.id, artifact.workId));
            }

            revalidateArtifact(data.artifactId, artifact.category);
            return { action: 'added', id: reactionId };
        }
    });
}

function revalidateArtifact(id: string, category?: string | null) {
    if (category) {
        revalidatePath(`/[locale]/artifacts/${category}/${id}`, 'page');
        revalidatePath(`/[locale]/artifacts/${category}/${id}/exhibit/[exhibitId]`, 'page');
    }
    revalidatePath(`/[locale]/artifacts`, 'page');
    revalidatePath(`/[locale]/cinema/${id}`, 'page');
    revalidatePath(`/[locale]/cinema`, 'page');
    revalidatePath(`/[locale]`, 'layout');
}

/**
 * Shared resonance ratio logic (should be moved to utils or shared lib eventually)
 */
function getResonanceRatio(artifact: { nature: string, animeType?: string | null }) {
    if (artifact.animeType && ['trailer', 'pv', 'mv', 'op', 'ed'].includes(artifact.animeType)) return 1.0;
    if (artifact.nature === 'cover') return 0.5;
    if (artifact.nature === 'live' || artifact.nature === 'compilation') return 0.2;
    return 1.0;
}
