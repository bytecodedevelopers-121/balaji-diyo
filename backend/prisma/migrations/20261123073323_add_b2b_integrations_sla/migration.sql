-- CreateEnum
CREATE TYPE "SlaTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'BREACHED');

-- CreateTable
CREATE TABLE "b2b_api_keys" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "rateLimitRpm" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2b_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_webhook_endpoints" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_webhook_deliveries" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3),
    "lastResponseCode" INTEGER,
    "lastError" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_sla_tickets" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "bookingId" TEXT,
    "customBookingId" TEXT,
    "subject" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" "SlaTicketStatus" NOT NULL DEFAULT 'OPEN',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "escalatedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_sla_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "b2b_api_keys_keyHash_key" ON "b2b_api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "b2b_api_keys_partnerId_isActive_idx" ON "b2b_api_keys"("partnerId", "isActive");

-- CreateIndex
CREATE INDEX "b2b_webhook_endpoints_partnerId_isActive_idx" ON "b2b_webhook_endpoints"("partnerId", "isActive");

-- CreateIndex
CREATE INDEX "b2b_webhook_deliveries_status_nextRetryAt_idx" ON "b2b_webhook_deliveries"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "b2b_webhook_deliveries_partnerId_createdAt_idx" ON "b2b_webhook_deliveries"("partnerId", "createdAt");

-- CreateIndex
CREATE INDEX "b2b_webhook_deliveries_endpointId_createdAt_idx" ON "b2b_webhook_deliveries"("endpointId", "createdAt");

-- CreateIndex
CREATE INDEX "b2b_sla_tickets_status_dueAt_idx" ON "b2b_sla_tickets"("status", "dueAt");

-- CreateIndex
CREATE INDEX "b2b_sla_tickets_partnerId_status_idx" ON "b2b_sla_tickets"("partnerId", "status");

-- CreateIndex
CREATE INDEX "b2b_sla_tickets_bookingId_idx" ON "b2b_sla_tickets"("bookingId");

-- CreateIndex
CREATE INDEX "b2b_sla_tickets_customBookingId_idx" ON "b2b_sla_tickets"("customBookingId");

-- AddForeignKey
ALTER TABLE "b2b_api_keys" ADD CONSTRAINT "b2b_api_keys_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "b2b_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_webhook_endpoints" ADD CONSTRAINT "b2b_webhook_endpoints_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "b2b_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_webhook_deliveries" ADD CONSTRAINT "b2b_webhook_deliveries_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "b2b_webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_sla_tickets" ADD CONSTRAINT "b2b_sla_tickets_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "b2b_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===== Integrity rules =====
ALTER TABLE "b2b_api_keys" ADD CONSTRAINT "b2b_api_keys_rate_chk" CHECK ("rateLimitRpm" >= 1 AND "rateLimitRpm" <= 10000);
ALTER TABLE "b2b_webhook_deliveries"
  ADD CONSTRAINT "b2b_webhook_deliveries_attempts_chk" CHECK ("attemptCount" >= 0 AND "maxAttempts" >= 1),
  ADD CONSTRAINT "b2b_webhook_deliveries_status_chk" CHECK ("status" IN ('PENDING', 'DELIVERED', 'FAILED'));
ALTER TABLE "b2b_sla_tickets" ADD CONSTRAINT "b2b_sla_tickets_priority_chk" CHECK ("priority" IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'));

-- Settlements post COMMISSION_CREDIT / CREDIT_LINE_REPAYMENT with an optional client reference: extend the
-- ledger idempotency index so a retried settlement can never post twice. Entries without a reference are unaffected.
DROP INDEX "b2b_ledger_idempotency_key";
CREATE UNIQUE INDEX "b2b_ledger_idempotency_key"
  ON "b2b_ledger_entries" ("entryType", "account", "referenceType", "referenceId")
  WHERE "referenceId" IS NOT NULL
    AND "entryType" IN ('WALLET_TOPUP', 'BOOKING_DEBIT', 'CREDIT_LINE_DRAW', 'REFUND_CREDIT', 'COMMISSION_CREDIT', 'CREDIT_LINE_REPAYMENT', 'ADJUSTMENT');
