ALTER TABLE "categories" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "keywords" text[];--> statement-breakpoint
ALTER TABLE "tax_profiles" ADD COLUMN "national_id" text;--> statement-breakpoint
ALTER TABLE "tax_profiles" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "slip_ref" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "receipt_hash" text;--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_slip_ref_user_uq" ON "transactions" USING btree ("user_id","slip_ref") WHERE "transactions"."slip_ref" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "transactions_receipt_hash_idx" ON "transactions" USING btree ("user_id","receipt_hash","date");