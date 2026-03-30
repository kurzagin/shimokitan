
import { getArtifactById, getDb, schema, eq } from '@shimokitan/db';
import { notFound } from 'next/navigation';
import { getDictionary, resolveTranslation, Locale } from '@shimokitan/utils';
import { TheaterVideo } from '@/lib/store/theater-store';
import { ArtifactDetailView } from '../../components/ArtifactDetailView';
import { ensureUserSync } from '@/app/[locale]/(pedalboard)/pedalboard/auth-helpers';

export async function generateMetadata(props: any) {
    const { id, locale } = await props.params;
    const artifact = await getArtifactById(id);
    if (!artifact) return {};

    const trans = resolveTranslation(artifact.translations, locale as Locale);
    return {
        title: `${trans?.title || "Artifact"} // Shimokitan Registry`,
        description: trans?.description || "Artifact detail in the Shimokitan District Registry.",
    };
}

export default async function ArtifactMasterPage({ params }: { params: Promise<{ id: string, locale: string, type: string }> }) {
    const { id, locale, type } = await params;
    const user = await ensureUserSync();
    const dict = await getDictionary(locale as Locale);
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
    
    let initialVideo = null;

    if (primaryExhibit) {
        initialVideo = {
            id: primaryExhibit.id,
            url: primaryExhibit.url || "",
            platform: "unknown" as TheaterVideo['platform']
        };
        // Simple platform inference
        const url = initialVideo.url.toLowerCase();
        if (url.includes("youtube.com") || url.includes("youtu.be")) initialVideo.platform = "youtube";
        else if (url.includes("bilibili.com")) initialVideo.platform = "bilibili";
        else if (url.includes("nicovideo.jp")) initialVideo.platform = "niconico";
    } else {
        // Fallback to primary video resource
        const primaryVideoResource = artifact.resources?.find((r) => 
            r.isPrimary && (r.role === 'video' || ['youtube', 'bilibili', 'niconico'].includes(r.platform || ""))
        );
        
        if (primaryVideoResource) {
            initialVideo = {
                id: `res-${primaryVideoResource.platform}-${primaryVideoResource.value.slice(-6)}`,
                url: primaryVideoResource.value || "",
                platform: (["youtube", "bilibili", "niconico"].includes(primaryVideoResource.platform || "") 
                    ? primaryVideoResource.platform 
                    : "unknown") as any
            };
        }
    }

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
