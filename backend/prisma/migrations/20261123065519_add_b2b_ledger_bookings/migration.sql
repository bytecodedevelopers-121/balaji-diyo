-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('WALLET_TOPUP', 'BOOKING_DEBIT', 'CREDIT_LINE_DRAW', 'CREDIT_LINE_REPAYMENT', 'REFUND_CREDIT', 'COMMISSION_CREDIT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LedgerAccount" AS ENUM ('WALLET', 'CREDIT');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "b2bStatusReason" TEXT,
ADD COLUMN     "departureId" TEXT;

-- AlterTable
ALTER TABLE "custom_bookings" ADD COLUMN     "b2bStatusReason" TEXT,
ADD COLUMN     "fundingMethod" TEXT,
ADD COLUMN     "netPayable" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "b2bPartnerId" TEXT;

-- CreateTable
CREATE TABLE "b2b_ledger_entries" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "account" "LedgerAccount" NOT NULL DEFAULT 'WALLET',
    "direction" "LedgerDirection" NOT NULL,
    "entryType" "LedgerEntryType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "creditUsedAfter" DECIMAL(12,2) NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "description" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2b_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_booking_amendments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "payload" JSONB NOT NULL,
    "requestedById" TEXT,
    "resolvedById" TEXT,
    "resolutionNote" TEXT,
    "priceDelta" DECIMAL(12,2),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_booking_amendments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "b2b_ledger_entries_partnerId_createdAt_idx" ON "b2b_ledger_entries"("partnerId", "createdAt");

-- CreateIndex
CREATE INDEX "b2b_ledger_entries_referenceType_referenceId_idx" ON "b2b_ledger_entries"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "b2b_booking_amendments_bookingId_status_idx" ON "b2b_booking_amendments"("bookingId", "status");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "package_departures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_b2bPartnerId_fkey" FOREIGN KEY ("b2bPartnerId") REFERENCES "b2b_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_ledger_entries" ADD CONSTRAINT "b2b_ledger_entries_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "b2b_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_booking_amendments" ADD CONSTRAINT "b2b_booking_amendments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===== Financial integrity enforced by the database =====

-- Balances can never go negative and credit can never exceed the limit.
ALTER TABLE "b2b_partners"
  ADD CONSTRAINT "b2b_partners_balances_chk" CHECK ("walletBalance" >= 0 AND "creditUsed" >= 0 AND "creditLimit" >= 0 AND "creditUsed" <= "creditLimit");

ALTER TABLE "b2b_ledger_entries"
  ADD CONSTRAINT "b2b_ledger_amount_chk" CHECK ("amount" > 0 AND "balanceAfter" >= 0 AND "creditUsedAfter" >= 0);

-- Idempotency backstop: one posting per (type, account, reference) for keyed entry types.
-- The service checks first under the partner row lock; this index makes a double-post impossible even if it didn't.
CREATE UNIQUE INDEX "b2b_ledger_idempotency_key"
  ON "b2b_ledger_entries" ("entryType", "account", "referenceType", "referenceId")
  WHERE "referenceId" IS NOT NULL AND "entryType" IN ('WALLET_TOPUP', 'BOOKING_DEBIT', 'CREDIT_LINE_DRAW', 'REFUND_CREDIT');

-- Immutable ledger: history is corrected only by appending reversing entries.
CREATE FUNCTION b2b_ledger_entries_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'b2b_ledger_entries is append-only (% not allowed)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER b2b_ledger_entries_no_update_delete
  BEFORE UPDATE OR DELETE ON "b2b_ledger_entries"
  FOR EACH ROW EXECUTE FUNCTION b2b_ledger_entries_immutable();
