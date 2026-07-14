CREATE TABLE "api_rate_limit" (
	"key" text PRIMARY KEY NOT NULL,
	"windowStart" timestamp NOT NULL,
	"count" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
