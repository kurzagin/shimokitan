import { MetadataRoute } from 'next';
import { getAllArtifacts, getAllEntities } from '@shimokitan/db';
import { locales } from '@shimokitan/utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://shimokitan.live';
  
  // Static routes
  const staticPaths = [
    '',
    '/artifacts',
    '/artists',
    '/about',
    '/contact',
    '/pedalboard',
    '/back-alley',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Add localized static routes
  for (const locale of locales) {
    for (const path of staticPaths) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: path === '' ? 1 : 0.8,
      });
    }
  }

  // Add dynamic artifacts
  try {
    const artifacts = await getAllArtifacts();
    for (const artifact of artifacts) {
      for (const locale of locales) {
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/artifacts/${artifact.id}`,
          lastModified: artifact.updatedAt || artifact.createdAt || new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }
  } catch (e) {
    console.error('Sitemap: Artifacts fetch failed', e);
  }

  // Add dynamic entities
  try {
    const entities = await getAllEntities();
    for (const entity of entities) {
      if (entity.civilStatus !== 'resident') continue;
      for (const locale of locales) {
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/${entity.slug}`,
          lastModified: entity.updatedAt || entity.createdAt || new Date(),
          changeFrequency: 'weekly',
          priority: 0.5,
        });
      }
    }
  } catch (e) {
    console.error('Sitemap: Entities fetch failed', e);
  }

  return sitemapEntries;
}
