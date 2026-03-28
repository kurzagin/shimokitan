import { NextRequest, NextResponse } from "next/server";
import { getDb, resolveTranslation, schema, and, eq, isNull, desc } from "@shimokitan/db";
import { sql } from "drizzle-orm";

/**
 * GET /api/gallery?cursor=0&limit=20
 * Returns paginated illustration artifacts for infinite scroll.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const cursor = parseInt(searchParams.get("cursor") || "0", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
    const locale = searchParams.get("locale") || "en";

    const db = getDb();
    if (!db) {
        return NextResponse.json({ items: [], nextCursor: null }, { status: 200 });
    }

    try {
        const rawArtifacts = await db.query.artifacts.findMany({
            where: and(
                eq(schema.artifacts.category, "illustration"),
                isNull(schema.artifacts.deletedAt)
            ),
            orderBy: [desc(schema.artifacts.resonance)],
            offset: cursor,
            limit: limit + 1,
            with: {
                media: {
                    with: {
                        media: true,
                    },
                },
                translations: true,
                credits: {
                    with: {
                        entity: {
                            with: {
                                translations: true,
                            },
                        },
                    },
                },
            },
        });

        const hasMore = rawArtifacts.length > limit;
        const items = rawArtifacts.slice(0, limit).map((a: any) => {
            const translation = resolveTranslation(a.translations, locale);
            const primaryCredit =
                a.credits?.find((c: any) => c.isPrimary) || a.credits?.[0];
            const entityTrans = resolveTranslation(
                primaryCredit?.entity?.translations,
                locale
            );

            /** Find the best image URL from the media bridge */
            const resolveImage = (): string | null => {
                if (!a.media || !Array.isArray(a.media)) return null;
                for (const role of ["NETWORK_GATEWAYS", "cover", "thumbnail"]) {
                    const match = a.media.find((m: any) => m.role === role);
                    if (match?.media?.url) return match.media.url;
                }
                const fallback = a.media.find((m: any) => m.media?.url);
                return fallback?.media?.url || null;
            };

            /** Resolve width/height from the media record */
            const resolveSize = (): { width: number; height: number } => {
                if (!a.media || !Array.isArray(a.media)) return { width: 1, height: 1 };
                for (const role of ["NETWORK_GATEWAYS", "cover", "thumbnail"]) {
                    const match = a.media.find((m: any) => m.role === role);
                    if (match?.media?.width && match?.media?.height) {
                        return { width: match.media.width, height: match.media.height };
                    }
                }
                return { width: 1, height: 1 };
            };

            const size = resolveSize();

            return {
                id: a.id,
                slug: a.slug || a.id,
                title: translation?.title || "ILLUSTRATION",
                artist: entityTrans?.name || primaryCredit?.entity?.name || "ANONYMOUS",
                image: resolveImage(),
                resonance: a.resonance || 0,
                description: translation?.description || "",
                category: a.category,
                width: size.width,
                height: size.height,
            };
        });

        return NextResponse.json({
            items,
            nextCursor: hasMore ? cursor + limit : null,
        });
    } catch (e) {
        console.error("[GALLERY_API] Error:", e);
        return NextResponse.json({ items: [], nextCursor: null }, { status: 200 });
    }
}
