
import { getArtifactById, getDb, schema, eq } from '@shimokitan/db';
import { notFound } from 'next/navigation';
import { getDictionary, resolveTranslation } from '@shimokitan/utils';
import { ArtifactDetailView } from '../../components/ArtifactDetailView';
import { ensureUserSync } from '@/app/[locale]/(pedalboard)/pedalboard/auth-helpers';

export async function generateMetadata(props: any) {
    const { id, locale } = await props.params;
    const artifact = await getArtifactById(id);
    if (!artifact) return {};

    const trans = resolveTranslation(artifact.translations, locale);
    return {
        title: `${trans?.title || 'Artifact'} // Shimokitan Registry`,
        description: trans?.description || 'Artifact detail in the Shimokitan District Registry.',
    };
}

export default async function ArtifactMasterPage(props: any) {
    const { id, locale, type } = await props.params;
    const user = await ensureUserSync();
    const dict = await getDictionary(locale);
    const artifact = await getArtifactById(id);

    if (!artifact) notFound();

    const db = getDb();
    const reactions = db ? await db.query.artifactReactions.findMany({
        where: eq(schema.artifactReactions.artifactId, id),
    }) : [];

    // Filter user's specific reactions
    const userReactionTypes = reactions
        .filter(r => r.authorId === user?.id)
        .map(r => r.type);

    // Initial reaction counts
    const reactionCounts = reactions.reduce((acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const platforms = db ? await db.query.externalPlatforms.findMany() : [];

    // For master view, initial video is either the primary exhibit or the artifact's own resource
    const primaryExhibit = artifact.exhibits?.find((e: any) => e.isPrimary);
    const initialVideo = primaryExhibit ? {
        id: primaryExhibit.id,
        title: resolveTranslation(primaryExhibit.translations, locale)?.title || 'Primary Exhibit',
        url: primaryExhibit.url || '',
        platform: primaryExhibit.type as any
    } : null;

    return (
        <ArtifactDetailView
            artifact={artifact}
            dict={dict}
            locale={locale}
            reactions={reactions}
            userReactionTypes={userReactionTypes}
            reactionCounts={reactionCounts}
            platforms={platforms}
            initialVideo={initialVideo}
            isExhibitView={false}
        />
    );
}
