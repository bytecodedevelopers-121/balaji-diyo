-- AlterTable
ALTER TABLE "payments" ADD COLUMN "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
ADD COLUMN "exchangeRate" DECIMAL(12,4),
ADD COLUMN "chargedAmount" DECIMAL(14,2);
