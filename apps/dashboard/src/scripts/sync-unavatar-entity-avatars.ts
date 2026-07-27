import { eq, isNull } from "drizzle-orm";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { getDb, schema } from "@shimokitan/db";
import { storagePaths } from "@shimokitan/utils";
import { uploadFileToR2 } from "@shimokitan/storage";

type SocialLink = { platform?: unknown; url?: unknown };
type Resolver = { provider: string; identifier: string; sourceUrl: string };

const apply = process.argv.includes("--apply");
const replace = process.argv.includes("--replace");
const db = getDb();
if (!db) throw new Error("DATABASE_URL is required");

function resolveSocialLink(links: unknown): Resolver | null {
  if (!Array.isArray(links)) return null;
  const priority = ["x", "youtube", "instagram", "twitch", "github", "soundcloud", "tiktok"];
  const normalized = (links as SocialLink[])
    .filter((item) => typeof item.platform === "string" && typeof item.url === "string")
    .sort((a, b) =>
      priority.indexOf(String(a.platform).toLowerCase())
      - priority.indexOf(String(b.platform).toLowerCase())
    );

  for (const item of normalized) {
    const platform = String(item.platform).toLowerCase();
    const sourceUrl = String(item.url);
    try {
      const url = new URL(sourceUrl);
      const segments = url.pathname.split("/").filter(Boolean);
      let identifier = segments[0]?.replace(/^@/, "");
      if (platform === "youtube") {
        const channelIndex = segments.findIndex((segment) => segment === "channel");
        identifier = channelIndex >= 0 ? segments[channelIndex + 1] : identifier;
      }
      if (identifier && priority.includes(platform)) {
        return { provider: platform, identifier: decodeURIComponent(identifier), sourceUrl };
      }
    } catch {
      continue;
    }
  }
  return null;
}

const entities = await db.query.entities.findMany({
  where: isNull(schema.entities.deletedAt),
  with: { translations: true, avatar: true },
});
const candidates = entities.flatMap((entity) => {
  if (entity.avatarId && !replace) return [];
  const resolver = resolveSocialLink(entity.socialLinks);
  return resolver ? [{ entity, resolver }] : [];
});

console.log(JSON.stringify({
  mode: apply ? "apply" : "audit",
  replace,
  activeEntities: entities.length,
  candidates: candidates.map(({ entity, resolver }) => ({
    entityId: entity.id,
    name: entity.translations.find((item) => item.locale === "en")?.name
      ?? entity.translations[0]?.name
      ?? entity.slug,
    provider: resolver.provider,
    identifier: resolver.identifier,
    hasAvatar: Boolean(entity.avatarId),
  })),
  skippedWithoutResolver: entities.filter((entity) =>
    (!entity.avatarId || replace) && !resolveSocialLink(entity.socialLinks)
  ).length,
}, null, 2));

if (!apply) process.exit(0);

const domain = (process.env.NEXT_PUBLIC_R2_DOMAIN?.trim() || "https://cdn.shimokitan.live").replace(/\/$/, "");
const uploaderId = (await db.select({ id: schema.users.id }).from(schema.users).limit(1))[0]?.id;
if (!uploaderId) throw new Error("No uploader user is available");

let synced = 0;
const failures: Array<{ entityId: string; error: string }> = [];

for (const { entity, resolver } of candidates) {
  try {
    const unavatarUrl = new URL(
      `https://unavatar.io/${encodeURIComponent(resolver.provider)}/${encodeURIComponent(resolver.identifier)}`
    );
    unavatarUrl.searchParams.set("fallback", "false");
    const headers: HeadersInit = {};
    if (process.env.UNAVATAR_API_KEY) headers["x-api-key"] = process.env.UNAVATAR_API_KEY;
    const response = await fetch(unavatarUrl, { headers, redirect: "follow" });
    if (!response.ok) throw new Error(`Unavatar HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) throw new Error(`Unavatar returned ${contentType || "non-image content"}`);

    const source = Buffer.from(await response.arrayBuffer());
    const processed = await sharp(source)
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    const metadata = await sharp(processed).metadata();
    const mediaId = nanoid();
    const key = storagePaths.userAvatar(entity.id, `${nanoid()}.webp`);
    await uploadFileToR2(processed, key, "image/webp");

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
        uploaderId: entity.avatar?.uploaderId ?? uploaderId,
        isOrphan: false,
      });
      await tx.update(schema.entities)
        .set({ avatarId: mediaId, updatedAt: new Date() })
        .where(eq(schema.entities.id, entity.id));
      if (entity.avatarId) {
        await tx.update(schema.media)
          .set({ isOrphan: true })
          .where(eq(schema.media.id, entity.avatarId));
      }
    });

    synced += 1;
    console.log(`synced ${entity.id} <- unavatar:${resolver.provider}/${resolver.identifier}`);
  } catch (error) {
    failures.push({
      entityId: entity.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

console.log(JSON.stringify({ synced, failed: failures.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
