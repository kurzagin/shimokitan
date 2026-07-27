import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { getDb, schema } from "@shimokitan/db";
import { storagePaths } from "@shimokitan/utils";
import { uploadFileToR2 } from "@shimokitan/storage";

const apply = process.argv.includes("--apply");
const roles = ["cover", "poster", "thumbnail"] as const;

const db = getDb();
if (!db) throw new Error("DATABASE_URL is required");

const artifacts = await db.query.artifacts.findMany({
  where: and(eq(schema.artifacts.category, "anime"), isNull(schema.artifacts.deletedAt)),
  with: {
    translations: true,
    media: { with: { media: true } },
  },
});

const candidates = artifacts.flatMap((artifact) => {
  const specs = (artifact.specs ?? {}) as Record<string, unknown>;
  const rawId = specs.anilist_id ?? specs.anilistId;
  const anilistId = Number(rawId);
  return Number.isInteger(anilistId) && anilistId > 0
    ? [{ artifact, anilistId }]
    : [];
});

console.log(
  JSON.stringify({
    mode: apply ? "apply" : "audit",
    animeArtifacts: artifacts.length,
    withAnilistId: candidates.length,
    missingAnilistId: artifacts.length - candidates.length,
    currentRoles: candidates.map(({ artifact, anilistId }) => ({
      artifactId: artifact.id,
      title: artifact.translations.find((t) => t.locale === "en")?.title
        ?? artifact.translations[0]?.title
        ?? artifact.slug,
      anilistId,
      roles: artifact.media.map((item) => item.role),
      r2Keys: [...new Set(artifact.media
        .filter((item) => roles.includes(item.role as typeof roles[number]))
        .map((item) => item.media.r2Key))],
    })),
  }, null, 2),
);

if (!apply) process.exit(0);

const domain = (process.env.NEXT_PUBLIC_R2_DOMAIN?.trim() || "https://cdn.shimokitan.live").replace(/\/$/, "");

let synced = 0;
const failures: Array<{ artifactId: string; anilistId: number; error: string }> = [];

for (const { artifact, anilistId } of candidates) {
  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        query: "query ($id: Int!) { Media(id: $id, type: ANIME) { coverImage { extraLarge large } } }",
        variables: { id: anilistId },
      }),
    });
    if (!response.ok) throw new Error(`AniList HTTP ${response.status}`);
    const payload = await response.json() as {
      data?: { Media?: { coverImage?: { extraLarge?: string; large?: string } } };
      errors?: Array<{ message: string }>;
    };
    if (payload.errors?.length) throw new Error(payload.errors.map((item) => item.message).join("; "));
    const sourceUrl = payload.data?.Media?.coverImage?.extraLarge
      ?? payload.data?.Media?.coverImage?.large;
    if (!sourceUrl) throw new Error("AniList returned no cover URL");

    const imageResponse = await fetch(sourceUrl);
    if (!imageResponse.ok) throw new Error(`Cover HTTP ${imageResponse.status}`);
    const source = Buffer.from(await imageResponse.arrayBuffer());
    const processed = await sharp(source).webp({ quality: 85 }).toBuffer();
    const metadata = await sharp(processed).metadata();

    const mediaId = nanoid();
    const key = storagePaths.artifactImage(artifact.id, `${nanoid()}.webp`, mediaId);
    await uploadFileToR2(processed, key, "image/webp");

    const priorLinks = artifact.media.filter((item) => roles.includes(item.role as typeof roles[number]));
    const uploaderId = priorLinks.find((item) => item.media.uploaderId)?.media.uploaderId
      ?? (await db.select({ id: schema.users.id }).from(schema.users).limit(1))[0]?.id;
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
        inArray(schema.artifactMedia.role, [...roles]),
      ));
      await tx.insert(schema.artifactMedia).values(roles.map((role, position) => ({
        artifactId: artifact.id,
        mediaId,
        role,
        position,
        isPrimary: role === "thumbnail",
        metadata: { source: "anilist", anilistId, sourceUrl },
      })));
      for (const prior of priorLinks) {
        const remaining = await tx.select({ count: sql<number>`count(*)` })
          .from(schema.artifactMedia)
          .where(eq(schema.artifactMedia.mediaId, prior.mediaId));
        if (Number(remaining[0]?.count ?? 0) === 0) {
          await tx.update(schema.media)
            .set({ isOrphan: true })
            .where(eq(schema.media.id, prior.mediaId));
        }
      }
    });

    synced += 1;
    console.log(`synced ${artifact.id} <- AniList ${anilistId}`);
  } catch (error) {
    failures.push({
      artifactId: artifact.id,
      anilistId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

console.log(JSON.stringify({ synced, failed: failures.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
