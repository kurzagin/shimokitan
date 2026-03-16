import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle, NeonDatabase } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
import { eq, desc, sql, isNull } from 'drizzle-orm';

// Required for environments where global WebSocket is not available (like local Node)
// In Bun or Cloudflare, WebSocket is globally defined.
if (typeof WebSocket === 'undefined') {
  // Use dynamic import to avoid bundling 'ws' where not needed
  import('ws').then((ws) => {
    neonConfig.webSocketConstructor = ws.default;
  }).catch(() => {
    console.warn('WebSocket is not defined and "ws" package could not be loaded.');
  });
}

let dbInstance: NeonDatabase<typeof schema>;

export function getDb() {
  if (!dbInstance) {
    const databaseUrl = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL;
    if (!databaseUrl) {
      console.warn('DATABASE_URL is not defined. Database operations will fail.');
      return null;
    }
    const pool = new Pool({ connectionString: databaseUrl });
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
}

export { schema };
export * from 'drizzle-orm';
export { resolveTranslation } from '@shimokitan/utils';

// --- UTILITIES ---

export async function getAllArtifacts() {
  const db = getDb();
  if (!db) return [];
  return await db.query.artifacts.findMany({
    where: isNull(schema.artifacts.deletedAt),
    orderBy: [desc(schema.artifacts.createdAt), desc(schema.artifacts.resonance)],
    with: {
      translations: true,
      thumbnail: true,
      poster: true,
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
  });
}

export async function getArtifactById(id: string) {
  const db = getDb();
  if (!db) return null;

  return await db.query.artifacts.findFirst({
    where: eq(schema.artifacts.id, id),
    with: artifactRelations
  });
}

export async function getArtifactBySlug(slug: string) {
    const db = getDb();
    if (!db) return null;

    return await db.query.artifacts.findFirst({
        where: eq(schema.artifacts.slug, slug),
        with: artifactRelations
    });
}

const artifactRelations = {
    credits: {
        with: {
            translations: true,
            entity: {
                with: {
                    translations: true,
                    avatar: true
                }
            }
        }
    },
    translations: true,
    resources: true,
    thumbnail: true,
    poster: true,
    vinyl: true,
    sourceArtifact: {
        with: {
            translations: true,
            thumbnail: true
        }
    },
    externalOriginal: true,
    zines: {
        with: {
            translations: true,
            author: true,
        }
    },
    tags: {
        with: {
            tag: {
                with: {
                    translations: true
                }
            }
        }
    },
    work: {
        with: {
            translations: true,
            thumbnail: true,
            poster: true,
            tags: {
                with: {
                    tag: {
                        with: {
                            translations: true
                        }
                    }
                }
            },
            credits: {
                with: {
                    translations: true,
                    entity: {
                        with: {
                            translations: true,
                            avatar: true
                        }
                    }
                }
            }
        }
    },
    media: {
        with: {
            media: true
        }
    },
    exhibits: {
        with: {
            translations: true,
            media: true
        }
    }
} as const;

export async function getZinesByArtifact(artifactId: string) {
  const db = getDb();
  if (!db) return [];
  return await db.query.zines.findMany({
    where: eq(schema.zines.artifactId, artifactId),
    orderBy: [desc(schema.zines.resonance)],
  });
}

export async function getAllEntities() {
  const db = getDb();
  if (!db) return [];
  return await db.query.entities.findMany({
    with: {
      translations: true,
      avatar: true,
      thumbnail: true,
      credits: {
        with: {
          artifact: {
            with: {
              translations: true,
              thumbnail: true
            }
          }
        }
      }
    }
  });
}

export async function getAllWorks() {
    const db = getDb();
    if (!db) return [];
    return await db.query.works.findMany({
        where: isNull(schema.works.deletedAt),
        orderBy: [desc(schema.works.createdAt), desc(schema.works.resonance)],
        with: {
            translations: true,
            thumbnail: true,
            poster: true,
            tags: {
                with: {
                    tag: {
                        with: {
                            translations: true
                        }
                    }
                }
            },
            artifacts: {
                with: {
                    translations: true,
                    thumbnail: true,
                    resources: true
                }
            },
            credits: {
                with: {
                    translations: true,
                    entity: {
                        with: {
                            translations: true,
                            avatar: true
                        }
                    }
                }
            }
        }
    });
}

export async function getEntityById(id: string) {
  const db = getDb();
  if (!db) return null;

  return await db.query.entities.findFirst({
    where: eq(schema.entities.id, id),
    with: {
      translations: true,
      avatar: true,
      thumbnail: true,
      credits: {
        with: {
          artifact: {
            with: {
              translations: true,
              resources: true,
              thumbnail: true
            }
          }
        }
      }
    }
  });
}

export async function getEntityBySlug(slug: string) {
  const db = getDb();
  if (!db) return null;

  return await db.query.entities.findFirst({
    where: eq(schema.entities.slug, slug),
    with: {
      translations: true,
      avatar: true,
      thumbnail: true,
      credits: {
        with: {
          artifact: {
            with: {
              translations: true,
              resources: true,
              thumbnail: true
            }
          }
        }
      }
    }
  });
}

