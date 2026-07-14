ALTER TABLE "provenance" ALTER COLUMN "factId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "fact" ADD COLUMN "provenanceId" uuid;--> statement-breakpoint
UPDATE "fact" f
SET "provenanceId" = (
  SELECT p."id" FROM "provenance" p
  WHERE p."factId" = f."id"
  ORDER BY p."createdAt", p."id"
  LIMIT 1
);
