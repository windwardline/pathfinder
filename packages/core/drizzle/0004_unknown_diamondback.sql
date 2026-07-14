ALTER TABLE "provenance" ADD COLUMN "documentId" uuid;--> statement-breakpoint
ALTER TABLE "provenance" ADD COLUMN "pageReference" text;--> statement-breakpoint
ALTER TABLE "provenance" ADD COLUMN "sectionReference" text;--> statement-breakpoint
ALTER TABLE "provenance" ADD COLUMN "ruleId" uuid;--> statement-breakpoint
ALTER TABLE "provenance" ADD COLUMN "extractionMetadata" json;--> statement-breakpoint
ALTER TABLE "provenance" ADD COLUMN "retentionPolicy" text;--> statement-breakpoint
ALTER TABLE "provenance" ADD COLUMN "status" text DEFAULT 'PUBLISHED' NOT NULL;