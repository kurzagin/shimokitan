
import { getArtifactById, getDb, schema, eq } from '@shimokitan/db';
import { notFound } from 'next/navigation';
import { getDictionary, resolveTranslation } from '@shimokitan/utils';
import { ArtifactDetailView } from '../../../../components/ArtifactDetailView';
import { ensureUserSync } from '@/app/[locale]/(pedalboard)/pedalboard/auth-helpers';

export async function generateMetadata(props: any) {
    const { id, exhibitId, locale } = await props.params;
    const artifact = await getArtifactById(id);
    if (!artifact) return {};

    const exhibit = artifact.exhibits?.find(e => e.id === exhibitId);
    if (!exhibit) return {};

    const trans = resolveTranslation(exhibit.translations, locale);
    const artTrans = resolveTranslation(artifact.translations, locale);

    return {
        title: `${trans?.title || 'Exhibit'} // ${artTrans?.title || 'Artifact'} // Shimokitan Registry`,
        description: trans?.description || `Exhibit detail in ${artTrans?.title || 'Artifact'}.`,
    };
}

export default async function ExhibitDetailPage(props: any) {
    const { id, exhibitId, locale } = await props.params;
    const user = await ensureUserSync();
    const dict = await getDictionary(locale);
    const artifact = await getArtifactById(id);

    if (!artifact) notFound();

    const exhibit = artifact.exhibits?.find(e => e.id === exhibitId);
    if (!exhibit) notFound();

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

    // Focus on the specific exhibit
    const initialVideo = {
        id: exhibit.id,
        title: resolveTranslation(exhibit.translations, locale)?.title || 'Selected Exhibit',
        url: exhibit.url || '',
        platform: exhibit.type as any
    };

    return (
        <ArtifactDetailView
            artifact={artifact}
            dict={dict}
            locale={locale}
            exhibitId={exhibitId}
            reactions={reactions}
            userReactionTypes={userReactionTypes}
            reactionCounts={reactionCounts}
            platforms={platforms}
            initialVideo={initialVideo}
            isExhibitView={true}
        />
    );
}
