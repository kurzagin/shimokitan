import React from "react";
import { MainLayout } from "../../components/layout/MainLayout";
import { getDb, schema, desc, eq, isNull, sql, and, gt, resolveTranslation } from "@shimokitan/db";
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

  // 1. Fetch Spotlight Artifacts (Highest Score)
  let spotlightArtifacts: any[] = [];
  try {
    const rawArtifacts = await db.query.artifacts.findMany({
      where: and(
        isNull(schema.artifacts.deletedAt),
        gt(schema.artifacts.resonance, "0")
      ),
      limit: 12, // Fetch more to allow in-memory sorting
      with: {
        media: {
          with: {
            media: true
          }
        },
        translations: true,
      },
    });

    // Map translations and sort by score manually
    spotlightArtifacts = rawArtifacts
      .map((a: any) => {
        const trans = resolveTranslation(a.translations, locale);
        const thumbnailMedia = (a.media as any[])?.find((m: any) => m.role === 'thumbnail')?.media;
        const posterMedia = (a.media as any[])?.find((m: any) => m.role === 'poster')?.media;
        
        return {
          ...a,
          title: trans?.title || "Untitled",
          description: trans?.description || "",
          thumbnailImage: thumbnailMedia?.url || null,
          posterImage: posterMedia?.url || null,
        };
      })
      .sort((a, b) => (b.resonance || 0) - (a.resonance || 0))
      .slice(0, 6);
  } catch (e: any) {
    if (process.env.NODE_ENV !== "production")
      console.error("Spotlight Fetch Failed:", e.message);
  }


  // 3. Featured Artifacts (The ones in "The Pit")
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
      limit: 20, // Fetch more to ensure we find ones with video resources
      with: {
        media: {
          with: {
            media: true
          }
        },
        translations: true,
        resources: true,
        zines: true, // Include zines to identify editorially endorsed content
      },
    });

    const processArtifact = (raw: any) => {
      const trans = resolveTranslation(raw.translations, locale);
      let videoUrl = null;
      
      // Specifically look for video/youtube first
      const primaryVideo = raw.resources?.find(
        (r: any) =>
          r.role === "video" ||
          r.platform === "youtube",
      ) || raw.resources?.find((r: any) => r.role === "audio"); // Fallback to audio if no video

      if (primaryVideo) {
        if (primaryVideo.value.includes("youtube.com/watch?v=")) {
          const vId = primaryVideo.value.split("v=")[1]?.split("&")[0];
          videoUrl = `https://www.youtube.com/embed/${vId}`;
        } else if (primaryVideo.value.includes("youtu.be/")) {
          const vId = primaryVideo.value.split("youtu.be/")[1]?.split("?")[0];
          videoUrl = `https://www.youtube.com/embed/${vId}`;
        } else if (primaryVideo.platform === 'youtube' && !primaryVideo.value.includes('/')) {
          videoUrl = `https://www.youtube.com/embed/${primaryVideo.value}`;
        } else {
          videoUrl = primaryVideo.value;
        }
      }

      const thumbnailMedia = (raw.media as any[])?.find((m: any) => m.role === 'thumbnail')?.media;
      const posterMedia = (raw.media as any[])?.find((m: any) => m.role === 'poster')?.media;

      return {
        ...raw,
        title: trans?.title || "Untitled",
        description: trans?.description || "",
        thumbnailImage: thumbnailMedia?.url || null,
        posterImage: posterMedia?.url || null,
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

      // Pick a different one for the "Video" card, ideally one with a videoUrl
      const artifactsWithVideo = rawPitArtifacts.filter((a, idx) => {
        if (idx === 0) return false; // Don't pick the same one
        return a.resources?.some(r => r.role === "video" || r.platform === "youtube");
      });

      if (artifactsWithVideo.length > 0) {
        videoArtifact = processArtifact(artifactsWithVideo[0]);
      } else if (rawPitArtifacts.length > 1) {
        videoArtifact = processArtifact(rawPitArtifacts[1]);
      } else {
        // Fallback: if only one exists, they stay the same or we leave videoArtifact null
        videoArtifact = featuredArtifact;
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
      const thumbnailMedia = (latestHosted.media as any[])?.find((m: any) => m.role === 'thumbnail')?.media;
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
        cover: thumbnailMedia?.url || "https://upload.wikimedia.org/wikipedia/en/3/39/The_Weeknd_-_Starboy.png",
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
        translations: true
      }
    });

    transmissions = rawTransmissions.map(t => {
      const trans = resolveTranslation(t.translations, locale);
      return {
        ...t,
        title: trans?.title || "Untitled Transmission",
        content: trans?.content || ""
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
