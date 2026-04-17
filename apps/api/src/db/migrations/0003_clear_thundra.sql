CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"monthly_limit" numeric(12, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "budgets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "wallet_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_username_unique" UNIQUE("username");