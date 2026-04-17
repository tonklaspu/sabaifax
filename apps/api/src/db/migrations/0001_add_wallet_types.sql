-- Add missing wallet_type enum values
ALTER TYPE "wallet_type" ADD VALUE IF NOT EXISTS 'savings';
ALTER TYPE "wallet_type" ADD VALUE IF NOT EXISTS 'investment';
