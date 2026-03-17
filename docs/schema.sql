-- SHIMOKITAN: RELATIONAL METADATA MODEL v1.4
-- Hardening: Integrity Constraints, Search Optimization, and Resource Validation.
-- Decision: NanoID-only (No Slug Column) for collision safety.

-- 1. NANOID GENERATOR (12 chars: [0-9a-zA-Z])
CREATE OR REPLACE FUNCTION nanoid(size integer DEFAULT 12)
RETURNS text AS $$
DECLARE
  alphabet text := '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  id text := '';
  i integer := 0;
BEGIN
  WHILE i < size LOOP
    id := id || substr(alphabet, get_byte(gen_random_bytes(1), 0) % 62 + 1, 1);
    i := i + 1;
  END LOOP;
  RETURN id;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 2. RESIDENTS (Coming Soon Leads)
CREATE TABLE IF NOT EXISTS residents (
    id TEXT PRIMARY KEY DEFAULT nanoid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENTITIES (Independent Artists, Agencies, Studios, Staff)
CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY DEFAULT nanoid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('independent', 'organization', 'agency', 'circle', 'staff')),
    bio TEXT,
    avatar_url TEXT,
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ARTIFACTS (Shards of content: anime, music, vtubers)
CREATE TABLE IF NOT EXISTS artifacts (
    id TEXT PRIMARY KEY DEFAULT nanoid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('anime', 'music', 'vtuber', 'asmr', 'zine', 'art', 'game')),
    description TEXT,
    cover_image TEXT,
    status TEXT DEFAULT 'back_alley' CHECK (status IN ('the_pit', 'back_alley', 'archived')),
    resonance INTEGER DEFAULT 0 CHECK (resonance >= 0),
    specs JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COLLECTIONS (The Mixtapes / Curated Selections)
CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY DEFAULT nanoid(),
    title TEXT NOT NULL,
    thesis TEXT,
    cover_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_artifacts (
    collection_id TEXT REFERENCES collections(id) ON DELETE CASCADE,
    artifact_id TEXT REFERENCES artifacts(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position >= 0),
    curator_note TEXT,
    PRIMARY KEY (collection_id, artifact_id),
    CONSTRAINT unique_position_per_collection UNIQUE (collection_id, position)
);

-- 5. RELATIONSHIPS & RESOURCES
CREATE TABLE IF NOT EXISTS artifact_credits (
    artifact_id TEXT REFERENCES artifacts(id) ON DELETE CASCADE,
    entity_id TEXT REFERENCES entities(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    PRIMARY KEY (artifact_id, entity_id, role)
);

CREATE TABLE IF NOT EXISTS artifact_resources (
    id TEXT PRIMARY KEY DEFAULT nanoid(),
    artifact_id TEXT REFERENCES artifacts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('mv', 'stream', 'social', 'gallery', 'store', 'other')),
    platform TEXT NOT NULL,
    external_id TEXT,
    url TEXT NOT NULL,
    embed_data JSONB DEFAULT '{}',
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Platform validation guard
    CONSTRAINT valid_resource_platform CHECK (
        (type = 'mv' AND platform IN ('youtube', 'bilibili', 'niconico')) OR
        (type = 'stream' AND platform IN ('youtube', 'twitch', 'spotify', 'soundcloud', 'apple_music')) OR
        (type = 'social' AND platform IN ('x', 'instagram', 'pixiv', 'threads')) OR
        (type = 'gallery' AND platform IN ('pixiv', 'artstation', 'twitter', 'instagram')) OR
        (type = 'store' AND platform IN ('booth', 'gumroad', 'bandcamp', 'steam')) OR
        type = 'other'
    )
);

-- 6. ZINES (Staff Resonance)
CREATE TABLE IF NOT EXISTS zines (
    id TEXT PRIMARY KEY DEFAULT nanoid(),
    artifact_id TEXT REFERENCES artifacts(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    resonance INTEGER DEFAULT 0 CHECK (resonance >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. HARDENED INDEXES
-- Partial unique index ensures only ONE primary resource per artifact
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_resource 
ON artifact_resources (artifact_id) 
WHERE is_primary = true;

-- Multi-language search optimization (using 'simple' instead of 'english')
CREATE INDEX IF NOT EXISTS idx_artifacts_search ON artifacts 
USING GIN (to_tsvector('simple', title || ' ' || coalesce(description, '')));

CREATE INDEX IF NOT EXISTS idx_zines_search ON zines 
USING GIN (to_tsvector('simple', content));

-- GIN indexes for JSONB specs/socials
CREATE INDEX IF NOT EXISTS idx_artifacts_specs ON artifacts USING GIN (specs);
CREATE INDEX IF NOT EXISTS idx_entities_social ON entities USING GIN (social_links);

-- 8. TRIGGERS
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_entities_modtime BEFORE UPDATE ON entities FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_artifacts_modtime BEFORE UPDATE ON artifacts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_collections_modtime BEFORE UPDATE ON collections FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
