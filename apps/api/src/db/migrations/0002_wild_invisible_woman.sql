CREATE TABLE "push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"platform" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "wallets" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "wallets" ALTER COLUMN "type" SET DEFAULT 'cash'::text;--> statement-breakpoint
DROP TYPE "public"."wallet_type";--> statement-breakpoint
CREATE TYPE "public"."wallet_type" AS ENUM('cash', 'bank', 'credit', 'savings', 'investment', 'other');--> statement-breakpoint
ALTER TABLE "wallets" ALTER COLUMN "type" SET DEFAULT 'cash'::"public"."wallet_type";--> statement-breakpoint
ALTER TABLE "wallets" ALTER COLUMN "type" SET DATA TYPE "public"."wallet_type" USING "type"::"public"."wallet_type";