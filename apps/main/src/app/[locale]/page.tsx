import React from "react";
import { MainLayout } from "../../components/layout/MainLayout";
import { getDb, schema, desc, eq, isNull, sql, and, gt, resolveTranslation, inArray, notInArray, ne, not } from "@shimokitan/db";
import HomeClient from "./HomeClient";
import { Locale, getDictionary } from "@shimokitan/utils";

import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    title: dict.home.title,
    description: dict.home.description,
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AppPage({
  params,
  searchParams,
}: any) {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  const db = getDb();

  if (!db) {
    if (process.env.NODE_ENV !== "production")
      console.warn("Database initialization failed - db is null");
    return <div>DB_CONNECTION_ERROR</div>;
  }

  try {
    const testQuery = await db.execute(sql`SELECT 1`);
  } catch (e: any) {
    if (process.env.NODE_ENV !== "production")
      console.error("Diagnostic SQL check failed:", e.message);
  }

  // 1. Fetch Spotlight Artifacts (Highest Resonance)
  let spotlightArtifacts: any[] = [];
  try {
    const rawArtifacts = await db.query.artifacts.findMany({
      where: and(
        isNull(schema.artifacts.deletedAt),
        gt(schema.artifacts.resonance, "0")
      ),
      orderBy: desc(schema.artifacts.resonance),
      limit: 12,
      with: {
        media: { with: { media: true } },
        translations: true,
      },
    });

    spotlightArtifacts = rawArtifacts.map((a: any) => {
      const trans = resolveTranslation(a.translations, locale);
      const artifactMedia = (a.media as any[]) || [];
      const thumbnail = artifactMedia.find((m: any) => m.role === 'thumbnail')?.media;
      const poster = artifactMedia.find((m: any) => m.role === 'poster')?.media;
      const cover = artifactMedia.find((m: any) => m.role === 'cover')?.media;
      const background = artifactMedia.find((m: any) => m.role === 'background')?.media;
      const firstAnyImage = artifactMedia.find((m: any) => m.media?.type === 'image')?.media;
      
      return {
        ...a,
        title: trans?.title || "Untitled",
        description: trans?.description || "",
        thumbnailImage: thumbnail?.url || poster?.url || cover?.url || background?.url || firstAnyImage?.url || null,
        posterImage: poster?.url || cover?.url || thumbnail?.url || null,
      };
    });
  } catch (e: any) {
    if (process.env.NODE_ENV !== "production")
      console.error("Spotlight Fetch Failed:", e.message);
  }

  // 1.5. Fetch Archive Artifacts (All Categories)
  let archiveArtifacts: any[] = [];
  try {
    const rawArchives = await db.query.artifacts.findMany({
      where: and(
        isNull(schema.artifacts.deletedAt),
        gt(schema.artifacts.resonance, "0")
      ),
      orderBy: desc(schema.artifacts.resonance),
      limit: 20, // More candidates to ensure we find an anime for the left slot
      with: {
        media: { with: { media: true } },
        translations: true,
      },
    });

    archiveArtifacts = rawArchives.map((a: any) => {
      const trans = resolveTranslation(a.translations, locale);
      const artifactMedia = (a.media as any[]) || [];
      const thumbnail = artifactMedia.find((m: any) => m.role === 'thumbnail')?.media;
      const poster = artifactMedia.find((m: any) => m.role === 'poster')?.media;
      const cover = artifactMedia.find((m: any) => m.role === 'cover')?.media;
      const firstAnyImage = artifactMedia.find((m: any) => m.media?.type === 'image')?.media;
      
      return {
        ...a,
        title: trans?.title || "Untitled",
        thumbnailImage: thumbnail?.url || poster?.url || cover?.url || firstAnyImage?.url || null,
        posterImage: poster?.url || cover?.url || thumbnail?.url || null,
      };
    });
  } catch (e: any) {
    if (process.env.NODE_ENV !== "production")
      console.error("Archive Fetch Failed:", e.message);
  }


  // 3. Featured Artifacts (The ones in "The Pit" - Always Anime)
  let featuredArtifact: any = null;
  let videoArtifact: any = null;
  try {
    const rawPitArtifacts = await db.query.artifacts.findMany({
      where: and(
        isNull(schema.artifacts.deletedAt),
        gt(schema.artifacts.resonance, "0"),
        eq(schema.artifacts.category, "anime")
      ),
      orderBy: desc(schema.artifacts.resonance),
      limit: 10,
      with: {
        media: { with: { media: true } },
        translations: true,
        resources: true,
        exhibits: true,
        zines: true,
      },
    });

    const processArtifact = (raw: any) => {
      const trans = resolveTranslation(raw.translations, locale);
      let videoUrl = null;
      // 1. Look for artifact resources (YouTube, Spotify, etc.)
      const primaryResource = raw.resources?.find(
        (r: any) =>
          r.role === "video" ||
          r.platform === "youtube",
      );

      // 2. Look for high-energy video exhibits (trailers, PVs, openings)
      const primaryExhibit = raw.exhibits?.find(
        (e: any) =>
          (e.type === "trailer" || e.type === "opening" || e.type === "ending" || e.type === "promotion") &&
          e.url
      );

      const candidateResource = primaryResource || primaryExhibit;

      if (candidateResource) {
        const value = (candidateResource.value || candidateResource.url) as string;
        if (value.includes("youtube.com/watch?v=")) {
          const vId = value.split("v=")[1]?.split("&")[0];
          videoUrl = `https://www.youtube.com/embed/${vId}`;
        } else if (value.includes("youtube.com/live/")) {
          const vId = value.split("live/")[1]?.split("?")[0];
          videoUrl = `https://www.youtube.com/embed/${vId}`;
        } else if (value.includes("youtube.com/v/")) {
          const vId = value.split("v/")[1]?.split("?")[0];
          videoUrl = `https://www.youtube.com/embed/${vId}`;
        } else if (value.includes("youtube.com/embed/")) {
          videoUrl = value; // Already an embed URL
        } else if (value.includes("youtu.be/")) {
          const vId = value.split("youtu.be/")[1]?.split("?")[0];
          videoUrl = `https://www.youtube.com/embed/${vId}`;
        } else if ((candidateResource as any).platform === 'youtube' && !value.includes('/')) {
          videoUrl = `https://www.youtube.com/embed/${value}`;
        } else {
          videoUrl = value;
        }
      }

      const artifactMedia = (raw.media as any[]) || [];
      
      const thumbnail = artifactMedia.find((m: any) => m.role === 'thumbnail')?.media;
      const poster = artifactMedia.find((m: any) => m.role === 'poster')?.media;
      const cover = artifactMedia.find((m: any) => m.role === 'cover')?.media;
      const background = artifactMedia.find((m: any) => m.role === 'background')?.media;
      const firstAnyImage = artifactMedia.find((m: any) => m.media?.type === 'image')?.media;

      return {
        ...raw,
        title: trans?.title || "Untitled",
        description: trans?.description || "",
        thumbnailImage: thumbnail?.url || poster?.url || cover?.url || background?.url || firstAnyImage?.url || null,
        posterImage: poster?.url || cover?.url || thumbnail?.url || null,
        videoUrl: videoUrl,
      };
    };

    if (rawPitArtifacts.length > 0) {
      // Find the first Anime artifact that specifically has a poster image
      const candidates = rawPitArtifacts
        .map(a => processArtifact(a))
        .filter(a => !!a.posterImage);

      if (candidates.length > 0) {
        featuredArtifact = candidates[0];
      }

    // 3.5. Fetch dedicated Video Artifact (Any Category with YouTube link)
    try {
      const topVideoArtifacts = await db.query.artifacts.findMany({
        where: isNull(schema.artifacts.deletedAt),
        orderBy: desc(schema.artifacts.resonance),
        limit: 15,
        with: {
          resources: true,
          exhibits: true,
          media: { with: { media: true } },
          translations: true,
        }
      });

      const videoCandidates = topVideoArtifacts
        .map(a => processArtifact(a))
        .filter(a => !!a.videoUrl);

      if (videoCandidates.length > 0) {
        // Priority 1: High resonance non-featured video
        const nonFeatured = videoCandidates.find(v => v.id !== featuredArtifact?.id);
        videoArtifact = nonFeatured || videoCandidates[0];
      } else {
        // Fallback: use whatever anime artifact we had
        videoArtifact = featuredArtifact;
      }
    } catch (e: any) {
      if (process.env.NODE_ENV !== "production")
        console.error("Video Artifact Fetch Failed:", e.message);
    }
    }
  } catch (e: any) {
    if (process.env.NODE_ENV !== "production")
      console.error("Featured Fetch Failed:", e.message);
  }

  // 4. Fetch Entities (Lifeforms)
  let entities: any[] = [];
  try {
    const rawEntities = await db.query.entities.findMany({
      where: and(
        isNull(schema.entities.deletedAt),
        eq(schema.entities.civilStatus, "resident")
      ),
      orderBy: [desc(schema.entities.createdAt)],
      limit: 10,
      with: {
        avatar: true,
        translations: true,
      },
    });

    entities = rawEntities.map((e: any) => {
      const trans = resolveTranslation(e.translations, locale);
      return {
        ...e,
        name: trans?.name || e.name || "Anonymous Entity",
        type: e.type?.toUpperCase() || "INDEPENDENT",
        _rawType: e.type,
        slug: e.slug,
        uid: e.uid || `UX_${e.id.slice(0, 4).toUpperCase()}`,
        professionalTitle: trans?.status || (e.type === 'independent' ? 'Resident' : e.type?.toUpperCase() || "Resident"),
        avatar: e.avatar?.url || null,
        highlights: [], // We could fetch credits here if needed
      };
    });
  } catch (e: any) {
    if (process.env.NODE_ENV !== "production")
      console.error("Entities Fetch Failed:", e.message);
  }

  // 5. Ambient World Data (Live Weather + DB Record Count)
  let weatherTemp = "8°C";
  try {
    // Exact coordinates for Shimokitazawa, Setagaya-ku, Tokyo
    const weatherRes = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=35.6611&longitude=139.6666&current_weather=true",
      { next: { revalidate: 1800 } },
    );
    if (weatherRes.ok) {
      const weatherData = await weatherRes.json();
      if (weatherData?.current_weather?.temperature) {
        weatherTemp = `${Math.round(weatherData.current_weather.temperature)}°C`;
      }
    }
  } catch (e) {
    if (process.env.NODE_ENV !== "production")
      console.error("Weather Sync Failed");
  }

  let totalResonance = "0";
  try {
    const resSum = await db.execute(
      sql`SELECT (SELECT COALESCE(SUM(resonance), 0) FROM artifacts) + (SELECT COALESCE(SUM(resonance), 0) FROM zines) as total`,
    );
    const total = Number((resSum as any)[0]?.total || 0);
    totalResonance =
      total < 1000 ? String(total) : `${(total / 1000).toFixed(1)}K`;
  } catch (e) {
    if (process.env.NODE_ENV !== "production")
      console.error("Resonance Count Failed");
  }

  // 6. Fetch Latest Hosted Track for Audio Widget
  let currentTrack: any = null;
  try {
    const latestHostedResource = await db.query.artifactResources.findFirst({
      where: and(
        eq(schema.artifactResources.role, 'hosted_audio'),
        eq(schema.artifactResources.isActive, true)
      ),
      orderBy: [desc(schema.artifactResources.createdAt)],
      with: {
        artifact: {
          with: {
            media: {
              with: {
                media: true
              }
            },
            translations: true,
            resources: true,
            credits: {
              with: {
                entity: {
                  with: {
                    translations: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (latestHostedResource?.artifact) {
      const latestHosted = latestHostedResource.artifact;
      const trans = resolveTranslation(latestHosted.translations, locale);
      const audioRes = latestHosted.resources?.find(r => r.role === 'hosted_audio');
      const artifactMedia = (latestHosted.media as any[]) || [];
      const thumbnail = artifactMedia.find((m: any) => m.role === 'thumbnail')?.media;
      const poster = artifactMedia.find((m: any) => m.role === 'poster')?.media;
      const cover = artifactMedia.find((m: any) => m.role === 'cover')?.media;
      const firstAnyImage = artifactMedia.find((m: any) => m.media?.type === 'image')?.media;
      
      const artistNames = (latestHosted as any).credits
        ?.filter((c: any) => c.isPrimary)
        .map((c: any) => {
          const entityTrans = resolveTranslation(c.entity?.translations, locale);
          return entityTrans?.name || c.entity?.name;
        })
        .filter(Boolean)
        .join(", ") || "Unknown Artist";

      currentTrack = {
        title: trans?.title || "Untitled",
        artist: artistNames,
        album: trans?.description?.slice(0, 50) || "Single",
        cover: thumbnail?.url || poster?.url || cover?.url || firstAnyImage?.url || "https://upload.wikimedia.org/wikipedia/en/3/39/The_Weeknd_-_Starboy.png",
        bitrate: "1411 KBPS",
        format: (audioRes as any)?.value?.endsWith('.m3u8') ? "HLS" : "LOSSLESS",
        src: (audioRes as any)?.value || ""
      };
    }
  } catch (e: any) {
    if (process.env.NODE_ENV !== "production")
      console.error("Hosted track fetch failed:", e.message);
  }

  // 7. Fetch Transmissions (Signal Feed)
  let transmissions: any[] = [];
  try {
    const rawTransmissions = await db.query.transmissions.findMany({
      where: eq(schema.transmissions.isActive, true),
      orderBy: [desc(schema.transmissions.publishedAt)],
      limit: 5,
      with: {
        translations: true,
        attachment: true
      }
    });

    transmissions = rawTransmissions.map(t => {
      const trans = resolveTranslation(t.translations, locale);
      return {
        ...t,
        title: trans?.title || "Untitled Transmission",
        content: trans?.content || "",
        attachmentUrl: (t as any).attachment?.url || null
      }
    });
  } catch (e: any) {
    if (process.env.NODE_ENV !== "production")
      console.error("Transmissions Fetch Failed:", e.message);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Shimokitan",
    "url": process.env.NEXT_PUBLIC_BASE_URL || "https://shimokitan.live",
    "description": dict.home.description,
    "publisher": {
      "@type": "Organization",
      "name": "Shimokitan",
      "logo": {
        "@type": "ImageObject",
        "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://shimokitan.live"}/icon.svg`
      }
    }
  };

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient
        spotlightArtifacts={spotlightArtifacts}
        archiveArtifacts={archiveArtifacts}
        featuredArtifact={featuredArtifact}
        videoArtifact={videoArtifact}
        entities={entities}
        dict={dict}
        weatherTemp={weatherTemp}
        totalResonance={totalResonance}
        transmissions={transmissions}
        artifactCount={spotlightArtifacts.length}
        entityCount={entities.length}
        currentTrack={currentTrack}
      />
    </MainLayout>
  );
}
