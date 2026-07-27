import { and, eq, isNull, sql } from "drizzle-orm";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { getDb, schema } from "@shimokitan/db";
import { extractMediaId, storagePaths } from "@shimokitan/utils";
import { uploadFileToR2 } from "@shimokitan/storage";

const apply = process.argv.includes("--apply");
const db = getDb();
if (!db) throw new Error("DATABASE_URL is required");

const artifacts = await db.query.artifacts.findMany({
  where: isNull(schema.artifacts.deletedAt),
  with: {
    translations: true,
    resources: true,
    media: { with: { media: true } },
  },
});

const candidates = artifacts.flatMap((artifact) => {
  const resources = artifact.resources
    .map((resource) => ({
      resource,
      videoId: extractMediaId(resource.value, "youtube"),
    }))
    .filter((item): item is typeof item & { videoId: string } => Boolean(item.videoId))
    .sort((a, b) =>
      Number(b.resource.isPrimary) - Number(a.resource.isPrimary)
      || Number(b.resource.role === "video") - Number(a.resource.role === "video")
    );
  const selected = resources[0];
  return selected ? [{ artifact, selected, youtubeResourceCount: resources.length }] : [];
});

console.log(JSON.stringify({
  mode: apply ? "apply" : "audit",
  activeArtifacts: artifacts.length,
  withYouTubeLink: candidates.length,
  candidates: candidates.map(({ artifact, selected, youtubeResourceCount }) => ({
    artifactId: artifact.id,
    title: artifact.translations.find((item) => item.locale === "en")?.title
      ?? artifact.translations[0]?.title
      ?? artifact.slug,
    videoId: selected.videoId,
    selectedResourceId: selected.resource.id,
    youtubeResourceCount,
    currentThumbnailKey: artifact.media.find((item) => item.role === "thumbnail")?.media.r2Key ?? null,
  })),
}, null, 2));

if (!apply) process.exit(0);

const domain = (process.env.NEXT_PUBLIC_R2_DOMAIN?.trim() || "https://cdn.shimokitan.live").replace(/\/$/, "");
const fallbackUploaderId = (await db.select({ id: schema.users.id }).from(schema.users).limit(1))[0]?.id;

let synced = 0;
const failures: Array<{ artifactId: string; videoId: string; error: string }> = [];

for (const { artifact, selected } of candidates) {
  try {
    let sourceUrl = `https://img.youtube.com/vi/${selected.videoId}/maxresdefault.jpg`;
    let response = await fetch(sourceUrl);
    if (!response.ok) {
      sourceUrl = `https://img.youtube.com/vi/${selected.videoId}/hqdefault.jpg`;
      response = await fetch(sourceUrl);
    }
    if (!response.ok) throw new Error(`YouTube thumbnail HTTP ${response.status}`);

    const original = Buffer.from(await response.arrayBuffer());
    const processed = await sharp(original).webp({ quality: 85 }).toBuffer();
    const metadata = await sharp(processed).metadata();
    const mediaId = nanoid();
    const key = storagePaths.artifactImage(artifact.id, `${nanoid()}.webp`, "thumbnail");
    await uploadFileToR2(processed, key, "image/webp");

    const priorThumbnail = artifact.media.find((item) => item.role === "thumbnail");
    const uploaderId = priorThumbnail?.media.uploaderId ?? fallbackUploaderId;
    if (!uploaderId) throw new Error("No uploader user is available");

    await db.transaction(async (tx) => {
      await tx.insert(schema.media).values({
        id: mediaId,
        type: "image",
        url: `${domain}/${key}`,
        r2Key: key,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        sizeBytes: processed.length,
        mimeType: "image/webp",
        uploaderId,
        isOrphan: false,
      });
      await tx.delete(schema.artifactMedia).where(and(
        eq(schema.artifactMedia.artifactId, artifact.id),
        eq(schema.artifactMedia.role, "thumbnail"),
      ));
      await tx.insert(schema.artifactMedia).values({
        artifactId: artifact.id,
        mediaId,
        role: "thumbnail",
        position: 0,
        isPrimary: true,
        metadata: {
          source: "youtube",
          videoId: selected.videoId,
          resourceId: selected.resource.id,
          sourceUrl,
        },
      });

      if (priorThumbnail) {
        const remaining = await tx.select({ count: sql<number>`count(*)` })
          .from(schema.artifactMedia)
          .where(eq(schema.artifactMedia.mediaId, priorThumbnail.mediaId));
        if (Number(remaining[0]?.count ?? 0) === 0) {
          await tx.update(schema.media)
            .set({ isOrphan: true })
            .where(eq(schema.media.id, priorThumbnail.mediaId));
        }
      }
    });

    synced += 1;
    console.log(`synced ${artifact.id} <- YouTube ${selected.videoId}`);
  } catch (error) {
    failures.push({
      artifactId: artifact.id,
      videoId: selected.videoId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

console.log(JSON.stringify({ synced, failed: failures.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
