-- CreateEnum
CREATE TYPE "B2BPartnerStatus" AS ENUM ('PENDING_KYC', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "B2BUserRole" AS ENUM ('AGENCY_ADMIN', 'BOOKING_AGENT', 'FINANCE_MANAGER');

-- CreateEnum
CREATE TYPE "B2BRateType" AS ENUM ('NET', 'COMMISSIONABLE');

-- CreateEnum
CREATE TYPE "B2BBookingChannel" AS ENUM ('B2C', 'B2B');

-- CreateEnum
CREATE TYPE "B2BBookingStatus" AS ENUM ('DRAFT', 'HELD', 'PENDING_APPROVAL', 'CONFIRMED', 'AMENDMENT_REQUESTED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "agentMarkup" DECIMAL(12,2),
ADD COLUMN     "b2bPartnerId" TEXT,
ADD COLUMN     "b2bStatus" "B2BBookingStatus",
ADD COLUMN     "channel" "B2BBookingChannel" NOT NULL DEFAULT 'B2C',
ADD COLUMN     "commissionAmount" DECIMAL(12,2),
ADD COLUMN     "netPayable" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "custom_bookings" ADD COLUMN     "b2bPartnerId" TEXT,
ADD COLUMN     "b2bStatus" "B2BBookingStatus",
ADD COLUMN     "channel" "B2BBookingChannel" NOT NULL DEFAULT 'B2C';

-- AlterTable
ALTER TABLE "package_departures" ADD COLUMN     "bookedSeats" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cutoffHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "heldSeats" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalSeats" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "b2bPartnerId" TEXT,
ADD COLUMN     "b2bRole" "B2BUserRole";

-- CreateTable
CREATE TABLE "b2b_partner_tiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "priorityOrder" INTEGER NOT NULL DEFAULT 0,
    "defaultRateType" "B2BRateType" NOT NULL DEFAULT 'COMMISSIONABLE',
    "defaultCommissionPct" DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    "defaultCreditLimit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditTermDays" INTEGER NOT NULL DEFAULT 0,
    "holdDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "slaResponseHours" INTEGER NOT NULL DEFAULT 4,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_partner_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_partners" (
    "id" TEXT NOT NULL,
    "partnerCode" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "website" TEXT,
    "taxOrRegNumber" TEXT,
    "status" "B2BPartnerStatus" NOT NULL DEFAULT 'PENDING_KYC',
    "kycVerifiedAt" TIMESTAMP(3),
    "kycVerifiedById" TEXT,
    "rejectionReason" TEXT,
    "tierId" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "walletBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditLimit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditUsed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditAlertSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "b2b_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_kyc_documents" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "b2b_partner_tiers_name_key" ON "b2b_partner_tiers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_partner_tiers_code_key" ON "b2b_partner_tiers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_partners_partnerCode_key" ON "b2b_partners"("partnerCode");

-- CreateIndex
CREATE INDEX "b2b_partners_status_tierId_idx" ON "b2b_partners"("status", "tierId");

-- CreateIndex
CREATE INDEX "b2b_kyc_documents_partnerId_idx" ON "b2b_kyc_documents"("partnerId");

-- CreateIndex
CREATE INDEX "bookings_b2bPartnerId_idx" ON "bookings"("b2bPartnerId");

-- CreateIndex
CREATE INDEX "custom_bookings_b2bPartnerId_idx" ON "custom_bookings"("b2bPartnerId");

-- CreateIndex
CREATE INDEX "users_b2bPartnerId_idx" ON "users"("b2bPartnerId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_b2bPartnerId_fkey" FOREIGN KEY ("b2bPartnerId") REFERENCES "b2b_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_b2bPartnerId_fkey" FOREIGN KEY ("b2bPartnerId") REFERENCES "b2b_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_bookings" ADD CONSTRAINT "custom_bookings_b2bPartnerId_fkey" FOREIGN KEY ("b2bPartnerId") REFERENCES "b2b_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_partners" ADD CONSTRAINT "b2b_partners_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "b2b_partner_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_kyc_documents" ADD CONSTRAINT "b2b_kyc_documents_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "b2b_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
