CREATE TABLE "external_platforms" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"icon_url" text,
	"accent_color" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "artifact_resources" ALTER COLUMN "platform" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "external_originals" ALTER COLUMN "platform" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "public"."artifact_resources" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."resource_role";--> statement-breakpoint
CREATE TYPE "public"."resource_role" AS ENUM('audio', 'video', 'hosted_audio', 'download', 'social', 'reference');--> statement-breakpoint
ALTER TABLE "public"."artifact_resources" ALTER COLUMN "role" SET DATA TYPE "public"."resource_role" USING "role"::"public"."resource_role";--> statement-breakpoint
DROP TYPE "public"."resource_platform";