CREATE TYPE "public"."exhibit_type" AS ENUM('trailer', 'opening', 'ending', 'promotion', 'gallery', 'other');--> statement-breakpoint
CREATE TYPE "public"."registry_application_status" AS ENUM('pending', 'reviewed', 'approved', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."artifact_category" ADD VALUE 'game';--> statement-breakpoint
ALTER TYPE "public"."resource_platform" ADD VALUE 'steam' BEFORE 'r2';--> statement-breakpoint
ALTER TYPE "public"."resource_platform" ADD VALUE 'netflix' BEFORE 'r2';--> statement-breakpoint
ALTER TYPE "public"."resource_platform" ADD VALUE 'amazon_prime' BEFORE 'r2';--> statement-breakpoint
ALTER TYPE "public"."resource_platform" ADD VALUE 'official_website' BEFORE 'r2';--> statement-breakpoint
CREATE TABLE "exhibits" (
	"id" text PRIMARY KEY NOT NULL,
	"artifact_id" text NOT NULL,
	"type" "exhibit_type" DEFAULT 'other' NOT NULL,
	"media_id" text,
	"url" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exhibits_i18n" (
	"exhibit_id" text NOT NULL,
	"locale" "locale" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	CONSTRAINT "exhibits_i18n_exhibit_id_locale_pk" PRIMARY KEY("exhibit_id","locale")
);
--> statement-breakpoint
CREATE TABLE "registry_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"contact_email" text NOT NULL,
	"artist_metadata" jsonb NOT NULL,
	"social_links" jsonb DEFAULT '[]'::jsonb,
	"artifact_samples" jsonb DEFAULT '[]'::jsonb,
	"ip_address" text NOT NULL,
	"status" "registry_application_status" DEFAULT 'pending',
	"internal_notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "work_credits" (
	"id" text PRIMARY KEY NOT NULL,
	"work_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"role" text NOT NULL,
	"contributor_class" "contributor_class" DEFAULT 'staff' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_credits_i18n" (
	"credit_id" text NOT NULL,
	"locale" "locale" NOT NULL,
	"role" text,
	CONSTRAINT "work_credits_i18n_credit_id_locale_pk" PRIMARY KEY("credit_id","locale")
);
--> statement-breakpoint
CREATE TABLE "work_tags" (
	"work_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "work_tags_work_id_tag_id_pk" PRIMARY KEY("work_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "works" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"category" "artifact_category" NOT NULL,
	"nature" "artifact_nature" DEFAULT 'original' NOT NULL,
	"status" "artifact_status" DEFAULT 'back_alley',
	"resonance" numeric(12, 4) DEFAULT '0.0000',
	"is_verified" boolean DEFAULT false,
	"poster_id" text,
	"thumbnail_id" text,
	"specs" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "works_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "works_i18n" (
	"work_id" text NOT NULL,
	"locale" "locale" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	CONSTRAINT "works_i18n_work_id_locale_pk" PRIMARY KEY("work_id","locale")
);
--> statement-breakpoint
ALTER TABLE "artifacts" ALTER COLUMN "resonance" SET DATA TYPE numeric(12, 4);--> statement-breakpoint
ALTER TABLE "artifacts" ALTER COLUMN "resonance" SET DEFAULT '0.0000';--> statement-breakpoint
ALTER TABLE "collections" ALTER COLUMN "resonance" SET DATA TYPE numeric(12, 4);--> statement-breakpoint
ALTER TABLE "collections" ALTER COLUMN "resonance" SET DEFAULT '0.0000';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "resonance_multiplier" SET DATA TYPE numeric(10, 4);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "resonance_multiplier" SET DEFAULT '1.0000';--> statement-breakpoint
ALTER TABLE "zines" ALTER COLUMN "resonance" SET DATA TYPE numeric(12, 4);--> statement-breakpoint
ALTER TABLE "zines" ALTER COLUMN "resonance" SET DEFAULT '0.0000';--> statement-breakpoint
ALTER TABLE "artifacts" ADD COLUMN "work_id" text;--> statement-breakpoint
ALTER TABLE "exhibits" ADD CONSTRAINT "exhibits_artifact_id_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exhibits" ADD CONSTRAINT "exhibits_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exhibits_i18n" ADD CONSTRAINT "exhibits_i18n_exhibit_id_exhibits_id_fk" FOREIGN KEY ("exhibit_id") REFERENCES "public"."exhibits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_credits" ADD CONSTRAINT "work_credits_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_credits" ADD CONSTRAINT "work_credits_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_credits_i18n" ADD CONSTRAINT "work_credits_i18n_credit_id_work_credits_id_fk" FOREIGN KEY ("credit_id") REFERENCES "public"."work_credits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_tags" ADD CONSTRAINT "work_tags_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_tags" ADD CONSTRAINT "work_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "works_i18n" ADD CONSTRAINT "works_i18n_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_exhibits_artifact" ON "exhibits" USING btree ("artifact_id");--> statement-breakpoint
CREATE INDEX "idx_exhibits_type" ON "exhibits" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_registry_applications_ip" ON "registry_applications" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "idx_registry_applications_status" ON "registry_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_registry_applications_email" ON "registry_applications" USING btree ("contact_email");--> statement-breakpoint
CREATE INDEX "idx_work_credits_work" ON "work_credits" USING btree ("work_id");--> statement-breakpoint
CREATE INDEX "idx_work_credits_entity" ON "work_credits" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "idx_works_category" ON "works" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_works_nature" ON "works" USING btree ("nature");--> statement-breakpoint
CREATE INDEX "idx_works_status" ON "works" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_works_i18n_title" ON "works_i18n" USING btree ("title");--> statement-breakpoint
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE set null ON UPDATE no action;