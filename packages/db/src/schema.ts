import {
    pgTable, text, timestamp, integer, boolean,
    jsonb, primaryKey, index, uniqueIndex, pgEnum, numeric
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ==================================================================
// ENUMS
// Centralised so the app layer can import and reuse them.
// ==================================================================

export const localeEnum = pgEnum("locale", ["en", "id", "ja"]);
export const mediaTypeEnum = pgEnum("media_type", ["image", "video", "audio", "document"]);
export const tagCategoryEnum = pgEnum("tag_category", ["genre", "mood", "style", "theme", "other", "identity"]);
export const entityTypeEnum = pgEnum("entity_type", ["independent", "organization", "agency", "circle"]);
export const userRoleEnum = pgEnum("user_role", ["founder", "architect", "resident", "ghost"]);
export const managerRoleEnum = pgEnum("manager_role", ["owner", "admin", "editor"]);
export const entityCivilStatusEnum = pgEnum("civil_status", ["sealed", "resident"]);

// Signal / Transmission Enums
export const signalSeverityEnum = pgEnum("signal_severity", ["critical", "high", "monitoring", "resolved"]);
export const transmissionTypeEnum = pgEnum("transmission_type", ["issue", "editorial", "changelog", "broadcast"]);

export const exhibitTypeEnum = pgEnum("exhibit_type", ["trailer", "opening", "ending", "promotion", "gallery", "other"]);

// Artifact-level enums
export const artifactCategoryEnum = pgEnum("artifact_category", ["music", "anime", "game", "illustration"]);

// Work Nature — the single most important discriminator
// original   : a first-creation work
// cover      : a reinterpretation; must reference a source artifact or external original
// live       : a recorded/broadcast live performance
// compilation: a curated set (EP, OST, etc.) that wraps multiple works
export const artifactNatureEnum = pgEnum("artifact_nature", ["original", "cover", "live", "compilation"]);

// true   : audio file is live on R2, player can serve it
// false  : external links only


// Anime artifact sub-type — describes the visual context
export const animeTypeEnum = pgEnum("anime_type", ["pv", "mv", "trailer", "op", "ed", "special"]);

// Resource role — what this external/internal link IS functionally
export const resourceRoleEnum = pgEnum("resource_role", [
    "audio",          // e.g. Spotify, Apple Music
    "video",          // e.g. YouTube MV / PV
    "hosted_audio",    // R2-hosted canonical audio
    "download",        // direct file download
    "social",          // Twitter, Instagram post
    "commerce",        // Booth, Fanbox, Steam
    "reference",       // original song reference for covers
]);

export const contributorClassEnum = pgEnum("contributor_class", ["author", "collaborator", "staff"]);
export const verificationTargetEnum = pgEnum("verification_target", ["artifact", "entity", "role_upgrade"]);
export const verificationStatusEnum = pgEnum("verification_status", ["pending", "approved", "rejected"]);
export const artifactMediaRoleEnum = pgEnum("artifact_media_role", ["cover", "poster", "background", "logo", "gallery", "thumbnail", "vinyl", "audio", "video", "source", "NETWORK_GATEWAYS", "header"]);
export const workMediaRoleEnum = pgEnum("work_media_role", ["poster", "thumbnail", "background", "logo", "gallery"]);
export const registryApplicationStatusEnum = pgEnum("registry_application_status", ["pending", "reviewed", "approved", "rejected"]);
export const artifactReactionTypeEnum = pgEnum("artifact_reaction_type", ["core", "flux", "void", "glitch", "spark", "pulse"]);

// ==================================================================
// 1.5. MEDIA REGISTRY
// Single source of truth for every binary asset stored in R2.
// ==================================================================

export const media = pgTable("media", {
    id: text("id").primaryKey(),
    type: mediaTypeEnum("type").notNull(),
    url: text("url").notNull(),
    r2Key: text("r2_key").notNull().unique(),

    // Visual metadata (images/video)
    blurhash: text("blurhash"),
    width: integer("width"),
    height: integer("height"),

    // Audio metadata — populated on upload for audio type
    durationMs: integer("duration_ms"),          // milliseconds
    waveformData: jsonb("waveform_data"),          // pre-computed waveform peaks for player UI
    audioFormat: text("audio_format"),             // "flac", "mp3", "aac", etc.
    sampleRate: integer("sample_rate"),           // Hz
    bitrate: integer("bitrate"),               // kbps

    sizeBytes: integer("size_bytes"),
    mimeType: text("mime_type").notNull(),

    uploaderId: text("uploader_id").notNull(),
    isOrphan: boolean("is_orphan").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ==================================================================
// 1.8. TAGS
// ==================================================================

export const tags = pgTable("tags", {
    id: text("id").primaryKey(),
    category: tagCategoryEnum("category").default("genre"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const tagsI18n = pgTable("tags_i18n", {
    tagId: text("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
    locale: localeEnum("locale").notNull(),
    name: text("name").notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.tagId, t.locale] }),
    nameIdx: index("idx_tags_i18n_name").on(t.name),
}));

// ==================================================================
// 2. ENTITIES  (Creators, Agencies, Studios, Groups)
// ==================================================================

export const entities = pgTable("entities", {
    id: text("id").primaryKey(),
    type: entityTypeEnum("type").notNull(),
    slug: text("slug").notNull().unique(),
    uid: text("uid").unique(),
    socialLinks: jsonb("social_links").default([]),
    civilStatus: entityCivilStatusEnum("civil_status").default("sealed").notNull(),
    isActive: boolean("is_active").default(true),   // soft-disable without deletion
    avatarId: text("avatar_id").references(() => media.id, { onDelete: "set null" }),
    thumbnailId: text("thumbnail_id").references(() => media.id, { onDelete: "set null" }),
    primaryArtifactId: text("primary_artifact_id").references((): any => artifacts.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const entitiesI18n = pgTable("entities_i18n", {
    entityId: text("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
    locale: localeEnum("locale").notNull(),
    name: text("name").notNull(),
    status: text("status"),
    bio: text("bio"),
}, (t) => ({
    pk: primaryKey({ columns: [t.entityId, t.locale] }),
    nameIdx: index("idx_entities_i18n_name").on(t.name),
}));

export const entityTags = pgTable("entity_tags", {
    entityId: text("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
    tagId: text("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.entityId, t.tagId] }),
}));

// ==================================================================
// 2.5. USERS
// ==================================================================

export const users = pgTable("users", {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    bio: text("bio"),
    status: text("status"),
    role: userRoleEnum("role").default("resident").notNull(),
    resonanceMultiplier: numeric("resonance_multiplier", { precision: 10, scale: 4 }).default("1.0000"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ==================================================================
// 2.6. ENTITY MANAGERS
// ==================================================================

export const entityManagers = pgTable("entity_managers", {
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    entityId: text("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
    role: managerRoleEnum("role").default("editor").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    pk: primaryKey({ columns: [t.userId, t.entityId] }),
}));

export const unitMembers = pgTable("unit_members", {
    unitId: text("unit_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
    memberId: text("member_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
    memberRole: text("member_role"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true }),  // track ex-members
}, (t) => ({
    pk: primaryKey({ columns: [t.unitId, t.memberId] }),
}));

// ==================================================================
// 2.8. WORKS (IP Anchors)
// ==================================================================

export const works = pgTable("works", {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    category: artifactCategoryEnum("category").notNull(),
    nature: artifactNatureEnum("nature").default("original").notNull(),

    resonance: numeric("resonance", { precision: 12, scale: 4 }).default("0.0000"),
    isVerified: boolean("is_verified").default(false),

    // Canon Identity Specs (BPM, Key, Release Date, Studio, Director)
    specs: jsonb("specs").default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (t) => ({
    categoryIdx: index("idx_works_category").on(t.category),
    natureIdx: index("idx_works_nature").on(t.nature),
}));

export const workTags = pgTable("work_tags", {
    workId: text("work_id").references(() => works.id, { onDelete: "cascade" }).notNull(),
    tagId: text("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.workId, t.tagId] }),
}));

export const workCredits = pgTable("work_credits", {
    id: text("id").primaryKey(),
    workId: text("work_id").references(() => works.id, { onDelete: "cascade" }).notNull(),
    entityId: text("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
    role: text("role").notNull(),
    contributorClass: contributorClassEnum("contributor_class").default("staff").notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    position: integer("position").default(0).notNull(),
}, (t) => ({
    workIdx: index("idx_work_credits_work").on(t.workId),
    entityIdx: index("idx_work_credits_entity").on(t.entityId),
}));

export const workCreditsI18n = pgTable("work_credits_i18n", {
    creditId: text("credit_id").references(() => workCredits.id, { onDelete: "cascade" }).notNull(),
    locale: localeEnum("locale").notNull(),
    role: text("role"),
}, (t) => ({
    pk: primaryKey({ columns: [t.creditId, t.locale] }),
}));

export const worksI18n = pgTable("works_i18n", {
    workId: text("work_id").references(() => works.id, { onDelete: "cascade" }).notNull(),
    locale: localeEnum("locale").notNull(),
    title: text("title").notNull(),
    description: text("description"),
}, (t) => ({
    pk: primaryKey({ columns: [t.workId, t.locale] }),
    titleIdx: index("idx_works_i18n_title").on(t.title),
}));

// ==================================================================
// 3. ARTIFACTS
//
// Design principles:
//   - `category`      : the domain (music | anime)
//   - `nature`        : the creative intent (original | cover | live | compilation)
//   - `specs`         : jsonb for category+nature-aware optional signatures
//                       validated by Zod in app layer, never mandatory in DB
// ==================================================================

export const artifacts = pgTable("artifacts", {
    id: text("id").primaryKey(),
    category: artifactCategoryEnum("category").notNull(),
    nature: artifactNatureEnum("nature").notNull(),

    // IP Anchor linkage
    workId: text("work_id").references(() => works.id, { onDelete: "set null" }),
    sourceArtifactId: text("source_artifact_id").references((): any => artifacts.id, { onDelete: "set null" }),

    // For anime: narrows down the visual context
    animeType: animeTypeEnum("anime_type"),  // null for music artifacts

    slug: text("slug").notNull().unique(),

    resonance: numeric("resonance", { precision: 12, scale: 4 }).default("0.0000"),
    specs: jsonb("specs").default({}),

    isVerified: boolean("is_verified").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (t) => ({
    categoryIdx: index("idx_artifacts_category").on(t.category),
    natureIdx: index("idx_artifacts_nature").on(t.nature),
    // Composite — common query: "all music originals"
    categoryNatureIdx: index("idx_artifacts_cat_nature").on(
        t.category, t.nature
    ),
}));



export const artifactsI18n = pgTable("artifacts_i18n", {
    artifactId: text("artifact_id").references(() => artifacts.id, { onDelete: "cascade" }).notNull(),
    locale: localeEnum("locale").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    // For covers: localised credit line e.g. "Original by Yorushika"
    sourceCredit: text("source_credit"),
}, (t) => ({
    pk: primaryKey({ columns: [t.artifactId, t.locale] }),
    titleIdx: index("idx_artifacts_i18n_title").on(t.title),
}));

export const artifactTags = pgTable("artifact_tags", {
    artifactId: text("artifact_id").references(() => artifacts.id, { onDelete: "cascade" }).notNull(),
    tagId: text("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.artifactId, t.tagId] }),
}));

// ==================================================================
// 4. ARTIFACT RESOURCES  (Manifestations / Presences)
//
// A resource is not just a link — it IS the work in a given context.
// A YouTube MV is a full manifestation of the music artifact.
// A hosted R2 audio is what the player consumes.
// Both can coexist on the same artifact with different roles.
// ==================================================================

export const artifactResources = pgTable("artifact_resources", {
    id: text("id").primaryKey(),
    artifactId: text("artifact_id").references(() => artifacts.id, { onDelete: "cascade" }).notNull(),

    role: resourceRoleEnum("role").notNull(),
    platform: text("platform").notNull(),

    // Flexible value field:
    // - For external: the full URL or platform-specific ID (e.g. YouTube video ID)
    // - For r2/hosted_audio: the mediaId referencing the media table
    value: text("value").notNull(),

    // Optional: links to media row when role = hosted_audio
    mediaId: text("media_id").references(() => media.id, { onDelete: "set null" }),

    // Rich embed/player metadata pulled from platform APIs
    // YouTube: { videoId, title, channelId, thumbnailUrl, durationMs, publishedAt }
    // Spotify: { trackId, previewUrl, albumArt, popularity }
    embedData: jsonb("embed_data").default({}),

    isPrimary: boolean("is_primary").default(false),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    artifactRoleIdx: index("idx_artifact_resources_role").on(t.artifactId, t.role),
    primaryIdx: index("idx_artifact_resources_primary").on(t.artifactId, t.isPrimary),
}));

// ==================================================================
// 4.5. ARTIFACT MEDIA  (Visual Assets Bridge)
// ==================================================================

export const artifactMedia = pgTable("artifact_media", {
    artifactId: text("artifact_id").references(() => artifacts.id, { onDelete: "cascade" }).notNull(),
    mediaId: text("media_id").references(() => media.id, { onDelete: "cascade" }).notNull(),
    role: artifactMediaRoleEnum("role").notNull(),
    position: integer("position").default(0).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    metadata: jsonb("metadata").default({}),
}, (t) => ({
    pk: primaryKey({ columns: [t.artifactId, t.mediaId, t.role] }),
    artifactRoleIdx: index("idx_artifact_media_role").on(t.artifactId, t.role),
}));

// ==================================================================
// 5. CREDITS
//
// Every role is a free-text `role` field for flexibility
// (community roles like "Illust", "Mix", "MV Dir" don't fit fixed enums).
// `contributorClass` provides the structural grouping for UI rendering.
// ==================================================================

export const artifactCredits = pgTable("artifact_credits", {
    id: text("id").primaryKey(),
    artifactId: text("artifact_id").references(() => artifacts.id, { onDelete: "cascade" }).notNull(),
    entityId: text("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
    role: text("role").notNull(),        // "Vocal", "Compose", "Arrange", "Illust", "MV Dir"
    displayRole: text("display_role"),          // Deprecated: move to i18n table
    contributorClass: contributorClassEnum("contributor_class").default("staff").notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    position: integer("position").default(0).notNull(),
    // For original artist credit on covers — even if they're not in the registry
    isOriginalArtist: boolean("is_original_artist").default(false).notNull(),
}, (t) => ({
    artifactIdx: index("idx_artifact_credits_artifact").on(t.artifactId),
    primaryIdx: index("idx_artifact_credits_primary").on(t.artifactId, t.isPrimary),
    entityIdx: index("idx_artifact_credits_entity").on(t.entityId),
}));

export const artifactCreditsI18n = pgTable("artifact_credits_i18n", {
    creditId: text("credit_id").references(() => artifactCredits.id, { onDelete: "cascade" }).notNull(),
    locale: localeEnum("locale").notNull(),
    role: text("role"), // Localized role name (e.g. "Vocalist" vs "ボーカル")
}, (t) => ({
    pk: primaryKey({ columns: [t.creditId, t.locale] }),
}));

export const workMedia = pgTable("work_media", {
    workId: text("work_id").references(() => works.id, { onDelete: "cascade" }).notNull(),
    mediaId: text("media_id").references(() => media.id, { onDelete: "cascade" }).notNull(),
    role: workMediaRoleEnum("role").notNull(),
    position: integer("position").default(0).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    metadata: jsonb("metadata").default({}),
}, (t) => ({
    pk: primaryKey({ columns: [t.workId, t.mediaId, t.role] }),
    workRoleIdx: index("idx_work_media_role").on(t.workId, t.role),
}));

// ==================================================================
// 6. COLLECTIONS  (Playlists, Curated Sets)
// ==================================================================

export const collections = pgTable("collections", {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    resonance: numeric("resonance", { precision: 12, scale: 4 }).default("0.0000"),
    coverId: text("cover_id").references(() => media.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const collectionsI18n = pgTable("collections_i18n", {
    collectionId: text("collection_id").references(() => collections.id, { onDelete: "cascade" }).notNull(),
    locale: localeEnum("locale").notNull(),
    title: text("title").notNull(),
    thesis: text("thesis"),
}, (t) => ({
    pk: primaryKey({ columns: [t.collectionId, t.locale] }),
    titleIdx: index("idx_collections_i18n_title").on(t.title),
}));

export const collectionArtifacts = pgTable("collection_artifacts", {
    collectionId: text("collection_id").references(() => collections.id, { onDelete: "cascade" }).notNull(),
    artifactId: text("artifact_id").references(() => artifacts.id, { onDelete: "cascade" }).notNull(),
    position: integer("position").notNull(),
    curatorNote: text("curator_note"),
}, (t) => ({
    pk: primaryKey({ columns: [t.collectionId, t.artifactId] }),
}));

// ==================================================================
// 7. ZINES  (Community Editorial / Reviews)
// ==================================================================

export const zines = pgTable("zines", {
    id: text("id").primaryKey(),
    artifactId: text("artifact_id").references(() => artifacts.id, { onDelete: "cascade" }),
    exhibitId: text("exhibit_id").references(() => exhibits.id, { onDelete: "set null" }),
    authorId: text("author_id").references(() => users.id).notNull(),
    resonance: numeric("resonance", { precision: 12, scale: 4 }).default("0.0000"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const artifactReactions = pgTable("artifact_reactions", {
    id: text("id").primaryKey(),
    artifactId: text("artifact_id").references(() => artifacts.id, { onDelete: "cascade" }).notNull(),
    exhibitId: text("exhibit_id").references(() => exhibits.id, { onDelete: "set null" }),
    authorId: text("author_id").references(() => users.id).notNull(),
    type: artifactReactionTypeEnum("type").default("spark").notNull(),
    energy: numeric("energy", { precision: 12, scale: 4 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    artifactIdx: index("idx_artifact_reactions_artifact").on(t.artifactId),
    authorIdx: index("idx_artifact_reactions_author").on(t.authorId),
    uniqueReaction: uniqueIndex("idx_artifact_reactions_unique").on(t.artifactId, t.authorId, t.exhibitId, t.type),
}));

export const zinesI18n = pgTable("zines_i18n", {
    zineId: text("zine_id").references(() => zines.id, { onDelete: "cascade" }).notNull(),
    locale: localeEnum("locale").notNull(),
    content: text("content").notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.zineId, t.locale] }),
}));

// ==================================================================
// 7.5. EXHIBITS (The Context)
// Exhibits represent supplementary materials, additional cuts, or specialized
// displays of a master artifact.
// ==================================================================

export const exhibits = pgTable('exhibits', {
	id: text('id').primaryKey(),
	artifactId: text('artifact_id').notNull().references(() => artifacts.id, { onDelete: 'cascade' }),
	type: exhibitTypeEnum('type').notNull().default('other'),
	mediaId: text('media_id').references(() => media.id, { onDelete: 'set null' }),
	url: text('url'),
	isPrimary: boolean('is_primary').default(false).notNull(),
	position: integer('position').notNull().default(0),
    resonance: numeric("resonance", { precision: 12, scale: 4 }).default("0.0000"),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
	artifactIdx: index('idx_exhibits_artifact').on(t.artifactId),
	typeIdx: index('idx_exhibits_type').on(t.type),
}));

export const exhibitsI18n = pgTable("exhibits_i18n", {
    exhibitId: text("exhibit_id").references(() => exhibits.id, { onDelete: "cascade" }).notNull(),
    locale: localeEnum("locale").notNull(),
    title: text("title").notNull(),
    description: text("description"),
}, (t) => ({
    pk: primaryKey({ columns: [t.exhibitId, t.locale] }),
}));

// ==================================================================
// 8. VERIFICATION REGISTRY  (Internal Audit Trail)
// ==================================================================

export const verificationRegistry = pgTable("verification_registry", {
    id: text("id").primaryKey(),
    targetId: text("target_id").notNull(),
    targetType: verificationTargetEnum("target_type").notNull(),
    status: verificationStatusEnum("status").default("pending"),
    r2Key: text("r2_key"),
    issuer: text("issuer"),
    grantedBy: text("granted_by"),
    grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    internalNotes: text("internal_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    targetIdx: index("idx_verification_target").on(t.targetType, t.targetId),
}));

// ==================================================================
// 9. TRANSMISSIONS (Signal / System News / Editorial)
// ==================================================================

export const transmissions = pgTable("transmissions", {
    id: text("id").primaryKey(),
    type: transmissionTypeEnum("type").default("issue").notNull(),
    topic: text("topic"),
    authorId: text("author_id").references(() => users.id),
    
    // Status Metadata (primarily for "issue" type)
    severity: signalSeverityEnum("severity"),
    affectedUsers: integer("affected_users").default(0),
    attachmentId: text("attachment_id").references(() => media.id, { onDelete: "set null" }),

    metadata: jsonb("metadata").default({}),
    
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
}, (t) => ({
    typeIdx: index("idx_transmissions_type").on(t.type),
    severityIdx: index("idx_transmissions_severity").on(t.severity),
    publishedIdx: index("idx_transmissions_published").on(t.publishedAt),
}));

export const transmissionsI18n = pgTable("transmissions_i18n", {
    transmissionId: text("transmission_id").references(() => transmissions.id, { onDelete: "cascade" }).notNull(),
    locale: localeEnum("locale").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(), // Markdown supported
}, (t) => ({
    pk: primaryKey({ columns: [t.transmissionId, t.locale] }),
}));

export const signalTimeline = pgTable("signal_timeline", {
    id: text("id").primaryKey(),
    transmissionId: text("transmission_id").references(() => transmissions.id, { onDelete: "cascade" }).notNull(),
    state: text("state").notNull(),
    note: text("note"),
    actorId: text("actor_id").references(() => users.id),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
}, (t) => ({
    transmissionIdx: index("idx_signal_timeline_transmission").on(t.transmissionId),
}));

// ==================================================================
// 10. REGISTRY APPLICATIONS (External Onboarding Queue)
// ==================================================================

export const registryApplications = pgTable("registry_applications", {
    id: text("id").primaryKey(),
    contactEmail: text("contact_email").notNull(),
    artistMetadata: jsonb("artist_metadata").notNull(), // { name: string, bio: string, type: string } localized
    socialLinks: jsonb("social_links").default([]),
    artifactSamples: jsonb("artifact_samples").default([]),
    ipAddress: text("ip_address").notNull(),
    status: registryApplicationStatusEnum("status").default("pending"),
    internalNotes: text("internal_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    ipIdx: index("idx_registry_applications_ip").on(t.ipAddress),
    statusIdx: index("idx_registry_applications_status").on(t.status),
    emailIdx: index("idx_registry_applications_email").on(t.contactEmail),
}));

// ==================================================================
// 8.5. HOSTING RIGHTS LOG
//
// Dedicated audit trail for the music hosting lifecycle.
// Separate from verificationRegistry so rights history is queryable
// independently from general content moderation.
// ==================================================================

                                                                        


// ==================================================================
// 11. EXTERNAL PLATFORMS (Global Registry)
// ==================================================================

export const externalPlatforms = pgTable("external_platforms", {
    id: text("id").primaryKey().default(sql`nanoid()`), // nanoid(12) or similar unique identifier
    name: text("name").notNull(),
    category: text("category").notNull(), // 'social' | 'commerce' | 'platform' | 'streaming' | 'archive' | 'portfolio' | 'video' | 'audio' | 'other'
    iconUrl: text("icon_url"),           // Optional override, default is cdn.shimokitan.live/platform/{id}.webp
    accentColor: text("accent_color"),   // e.g. '#0096fa'
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ==================================================================
// RELATIONS
// ==================================================================

export const artifactsRelations = relations(artifacts, ({ one, many }) => ({
    translations: many(artifactsI18n),
    credits: many(artifactCredits),
    resources: many(artifactResources),
    media: many(artifactMedia),
    zines: many(zines),
    reactions: many(artifactReactions),
    exhibits: many(exhibits),
    collections: many(collectionArtifacts),
    tags: many(artifactTags),
    verifications: many(verificationRegistry, { relationName: "artifact_verifications" }),

    work: one(works, {
        fields: [artifacts.workId],
        references: [works.id],
    }),
    sourceArtifact: one(artifacts, {
        fields: [artifacts.sourceArtifactId],
        references: [artifacts.id],
    }),
}));

export const workMediaRelations = relations(workMedia, ({ one }) => ({
    work: one(works, {
        fields: [workMedia.workId],
        references: [works.id],
    }),
    media: one(media, {
        fields: [workMedia.mediaId],
        references: [media.id],
    }),
}));

export const worksRelations = relations(works, ({ one, many }) => ({
    translations: many(worksI18n),
    artifacts: many(artifacts),
    credits: many(workCredits),
    tags: many(workTags),
    media: many(workMedia),
}));

export const workTagsRelations = relations(workTags, ({ one }) => ({
    work: one(works, { fields: [workTags.workId], references: [works.id] }),
    tag: one(tags, { fields: [workTags.tagId], references: [tags.id] }),
}));

export const workCreditsRelations = relations(workCredits, ({ one, many }) => ({
    work: one(works, { fields: [workCredits.workId], references: [works.id] }),
    entity: one(entities, { fields: [workCredits.entityId], references: [entities.id] }),
    translations: many(workCreditsI18n),
}));

export const workCreditsI18nRelations = relations(workCreditsI18n, ({ one }) => ({
    credit: one(workCredits, { fields: [workCreditsI18n.creditId], references: [workCredits.id] }),
}));

export const worksI18nRelations = relations(worksI18n, ({ one }) => ({
    work: one(works, { fields: [worksI18n.workId], references: [works.id] }),
}));

export const artifactsI18nRelations = relations(artifactsI18n, ({ one }) => ({
    artifact: one(artifacts, { fields: [artifactsI18n.artifactId], references: [artifacts.id] }),
}));

export const artifactTagsRelations = relations(artifactTags, ({ one }) => ({
    artifact: one(artifacts, { fields: [artifactTags.artifactId], references: [artifacts.id] }),
    tag: one(tags, { fields: [artifactTags.tagId], references: [tags.id] }),
}));

export const artifactResourcesRelations = relations(artifactResources, ({ one }) => ({
    artifact: one(artifacts, { fields: [artifactResources.artifactId], references: [artifacts.id] }),
    media: one(media, { fields: [artifactResources.mediaId], references: [media.id] }),
}));

export const artifactMediaRelations = relations(artifactMedia, ({ one }) => ({
    artifact: one(artifacts, { fields: [artifactMedia.artifactId], references: [artifacts.id] }),
    media: one(media, { fields: [artifactMedia.mediaId], references: [media.id] }),
}));

export const artifactCreditsRelations = relations(artifactCredits, ({ one, many }) => ({
    artifact: one(artifacts, { fields: [artifactCredits.artifactId], references: [artifacts.id] }),
    entity: one(entities, { fields: [artifactCredits.entityId], references: [entities.id] }),
    translations: many(artifactCreditsI18n),
}));

export const artifactCreditsI18nRelations = relations(artifactCreditsI18n, ({ one }) => ({
    credit: one(artifactCredits, { fields: [artifactCreditsI18n.creditId], references: [artifactCredits.id] }),
}));

export const entitiesRelations = relations(entities, ({ one, many }) => ({
    translations: many(entitiesI18n),
    credits: many(artifactCredits),
    verifications: many(verificationRegistry, { relationName: "entity_verifications" }),
    managers: many(entityManagers),
    members: many(unitMembers, { relationName: "unit_members" }),
    units: many(unitMembers, { relationName: "member_units" }),
    tags: many(entityTags),
    avatar: one(media, { fields: [entities.avatarId], references: [media.id] }),
    thumbnail: one(media, { fields: [entities.thumbnailId], references: [media.id] }),
    primaryArtifact: one(artifacts, {
        fields: [entities.primaryArtifactId],
        references: [artifacts.id],
    }),
}));

export const entitiesI18nRelations = relations(entitiesI18n, ({ one }) => ({
    entity: one(entities, { fields: [entitiesI18n.entityId], references: [entities.id] }),
}));

export const entityManagersRelations = relations(entityManagers, ({ one }) => ({
    user: one(users, { fields: [entityManagers.userId], references: [users.id] }),
    entity: one(entities, { fields: [entityManagers.entityId], references: [entities.id] }),
}));

export const unitMembersRelations = relations(unitMembers, ({ one }) => ({
    unit: one(entities, { fields: [unitMembers.unitId], references: [entities.id], relationName: "unit_members" }),
    member: one(entities, { fields: [unitMembers.memberId], references: [entities.id], relationName: "member_units" }),
}));

export const entityTagsRelations = relations(entityTags, ({ one }) => ({
    entity: one(entities, { fields: [entityTags.entityId], references: [entities.id] }),
    tag: one(tags, { fields: [entityTags.tagId], references: [tags.id] }),
}));

export const mediaRelations = relations(media, ({ one }) => ({
    uploader: one(users, { fields: [media.uploaderId], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
    managedEntities: many(entityManagers),
    zines: many(zines),
    reactions: many(artifactReactions),

}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
    translations: many(collectionsI18n),
    artifacts: many(collectionArtifacts),
    cover: one(media, { fields: [collections.coverId], references: [media.id] }),
}));

export const exhibitsRelations = relations(exhibits, ({ one, many }) => ({
    artifact: one(artifacts, { fields: [exhibits.artifactId], references: [artifacts.id] }),
    translations: many(exhibitsI18n),
    media: one(media, { fields: [exhibits.mediaId], references: [media.id] }),
    zines: many(zines),
}));

export const exhibitsI18nRelations = relations(exhibitsI18n, ({ one }) => ({
    exhibit: one(exhibits, { fields: [exhibitsI18n.exhibitId], references: [exhibits.id] }),
}));

export const collectionsI18nRelations = relations(collectionsI18n, ({ one }) => ({
    collection: one(collections, { fields: [collectionsI18n.collectionId], references: [collections.id] }),
}));

export const collectionArtifactsRelations = relations(collectionArtifacts, ({ one }) => ({
    collection: one(collections, { fields: [collectionArtifacts.collectionId], references: [collections.id] }),
    artifact: one(artifacts, { fields: [collectionArtifacts.artifactId], references: [artifacts.id] }),
}));

export const zinesRelations = relations(zines, ({ one, many }) => ({
    translations: many(zinesI18n),
    artifact: one(artifacts, { fields: [zines.artifactId], references: [artifacts.id] }),
    exhibit: one(exhibits, { fields: [zines.exhibitId], references: [exhibits.id] }),
    author: one(users, { fields: [zines.authorId], references: [users.id] }),
}));

export const zinesI18nRelations = relations(zinesI18n, ({ one }) => ({
    zine: one(zines, { fields: [zinesI18n.zineId], references: [zines.id] }),
}));

export const artifactReactionsRelations = relations(artifactReactions, ({ one }) => ({
    artifact: one(artifacts, { fields: [artifactReactions.artifactId], references: [artifacts.id] }),
    author: one(users, { fields: [artifactReactions.authorId], references: [users.id] }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
    translations: many(tagsI18n),
    artifacts: many(artifactTags),
    entities: many(entityTags),
}));

export const tagsI18nRelations = relations(tagsI18n, ({ one }) => ({
    tag: one(tags, { fields: [tagsI18n.tagId], references: [tags.id] }),
}));

export const verificationRegistryRelations = relations(verificationRegistry, ({ one }) => ({
    artifact: one(artifacts, {
        fields: [verificationRegistry.targetId],
        references: [artifacts.id],
        relationName: "artifact_verifications",
    }),
    entity: one(entities, {
        fields: [verificationRegistry.targetId],
        references: [entities.id],
        relationName: "entity_verifications",
    }),
}));




export const transmissionsRelations = relations(transmissions, ({ one, many }) => ({
    translations: many(transmissionsI18n),
    author: one(users, { fields: [transmissions.authorId], references: [users.id] }),
    attachment: one(media, { fields: [transmissions.attachmentId], references: [media.id] }),
    timeline: many(signalTimeline),
}));

export const transmissionsI18nRelations = relations(transmissionsI18n, ({ one }) => ({
    transmission: one(transmissions, { fields: [transmissionsI18n.transmissionId], references: [transmissions.id] }),
}));

export const signalTimelineRelations = relations(signalTimeline, ({ one }) => ({
    transmission: one(transmissions, { fields: [signalTimeline.transmissionId], references: [transmissions.id] }),
    actor: one(users, { fields: [signalTimeline.actorId], references: [users.id] }),
}));
export const registryApplicationsRelations = relations(registryApplications, ({ many }) => ({
    // Applications don't have direct relations to other tables yet 
    // to maintain a clean queue, but can be referenced by audit logs if needed.
}));
