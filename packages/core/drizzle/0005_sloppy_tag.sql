CREATE TABLE "account_deletion_receipt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subjectHash" text NOT NULL,
	"correlationId" text NOT NULL,
	"deletedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_deletion_receipt_subjectHash_unique" UNIQUE("subjectHash")
);
