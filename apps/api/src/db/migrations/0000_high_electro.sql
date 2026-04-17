CREATE TYPE "public"."plan" AS ENUM('free', 'premium');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('expense', 'income', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."wallet_type" AS ENUM('cash', 'bank', 'credit', 'saving', 'other');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"icon" text DEFAULT '📦',
	"type" "transaction_type" NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"plan" "plan" DEFAULT 'free',
	"plan_expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tax_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"gross_income" numeric(12, 2) DEFAULT '0',
	"marital_status" text DEFAULT 'single',
	"child_count" integer DEFAULT 0,
	"income_type" text DEFAULT 'employment',
	"life_insurance" numeric(12, 2) DEFAULT '0',
	"health_insurance" numeric(12, 2) DEFAULT '0',
	"social_security" numeric(12, 2) DEFAULT '9000',
	"ssf" numeric(12, 2) DEFAULT '0',
	"rmf" numeric(12, 2) DEFAULT '0',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tax_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"to_wallet_id" uuid,
	"category_id" uuid,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"note" text,
	"date" timestamp DEFAULT now(),
	"is_tax_deductible" boolean DEFAULT false,
	"receipt_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "wallet_type" DEFAULT 'cash',
	"balance" numeric(12, 2) DEFAULT '0',
	"icon" text DEFAULT '💰',
	"color" text DEFAULT '#00C896',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
