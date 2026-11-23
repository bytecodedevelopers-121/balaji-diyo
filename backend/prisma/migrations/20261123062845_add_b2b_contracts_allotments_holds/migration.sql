-- CreateTable
CREATE TABLE "b2b_partner_contracts" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "rateType" "B2BRateType" NOT NULL DEFAULT 'NET',
    "netUnitPrice" DECIMAL(12,2),
    "commissionPct" DECIMAL(5,2),
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "blackoutDates" JSONB,
    "minPax" INTEGER,
    "maxPax" INTEGER,
    "cutoffHours" INTEGER NOT NULL DEFAULT 48,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_partner_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_inventory_allotments" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "departureId" TEXT NOT NULL,
    "allocatedSeats" INTEGER NOT NULL,
    "bookedSeats" INTEGER NOT NULL DEFAULT 0,
    "heldSeats" INTEGER NOT NULL DEFAULT 0,
    "releaseBeforeHours" INTEGER NOT NULL DEFAULT 72,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_inventory_allotments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_inventory_holds" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "departureId" TEXT NOT NULL,
    "seatsHeld" INTEGER NOT NULL,
    "allotmentId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "convertedBookingId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_inventory_holds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "b2b_partner_contracts_partnerId_packageId_isActive_idx" ON "b2b_partner_contracts"("partnerId", "packageId", "isActive");

-- CreateIndex
CREATE INDEX "b2b_inventory_allotments_departureId_idx" ON "b2b_inventory_allotments"("departureId");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_inventory_allotments_partnerId_departureId_key" ON "b2b_inventory_allotments"("partnerId", "departureId");

-- CreateIndex
CREATE INDEX "b2b_inventory_holds_status_expiresAt_idx" ON "b2b_inventory_holds"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "b2b_inventory_holds_partnerId_status_idx" ON "b2b_inventory_holds"("partnerId", "status");

-- AddForeignKey
ALTER TABLE "b2b_partner_contracts" ADD CONSTRAINT "b2b_partner_contracts_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "b2b_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_partner_contracts" ADD CONSTRAINT "b2b_partner_contracts_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_inventory_allotments" ADD CONSTRAINT "b2b_inventory_allotments_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "b2b_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_inventory_allotments" ADD CONSTRAINT "b2b_inventory_allotments_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "package_departures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_inventory_holds" ADD CONSTRAINT "b2b_inventory_holds_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "b2b_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_inventory_holds" ADD CONSTRAINT "b2b_inventory_holds_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "package_departures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===== Invariants enforced in the database as the last line of defence =====
-- (the application serializes writers with row locks; these make a bug fail loudly instead of corrupting inventory)

ALTER TABLE "package_departures"
  ADD CONSTRAINT "package_departures_seats_nonneg_chk" CHECK ("bookedSeats" >= 0 AND "heldSeats" >= 0 AND "cutoffHours" >= 0),
  ADD CONSTRAINT "package_departures_capacity_chk" CHECK ("totalSeats" IS NULL OR ("totalSeats" >= 0 AND "bookedSeats" + "heldSeats" <= "totalSeats"));

ALTER TABLE "b2b_inventory_allotments"
  ADD CONSTRAINT "b2b_allotments_seats_chk" CHECK ("allocatedSeats" >= 0 AND "bookedSeats" >= 0 AND "heldSeats" >= 0 AND "allocatedSeats" >= "bookedSeats" + "heldSeats" AND "releaseBeforeHours" >= 0);

ALTER TABLE "b2b_inventory_holds"
  ADD CONSTRAINT "b2b_holds_seats_chk" CHECK ("seatsHeld" > 0),
  ADD CONSTRAINT "b2b_holds_status_chk" CHECK ("status" IN ('ACTIVE', 'CONVERTED', 'EXPIRED', 'RELEASED'));

ALTER TABLE "b2b_partner_contracts"
  ADD CONSTRAINT "b2b_contracts_dates_chk" CHECK ("validTo" >= "validFrom"),
  ADD CONSTRAINT "b2b_contracts_pax_chk" CHECK (("minPax" IS NULL OR "minPax" >= 1) AND ("maxPax" IS NULL OR "maxPax" >= 1) AND ("minPax" IS NULL OR "maxPax" IS NULL OR "minPax" <= "maxPax")),
  ADD CONSTRAINT "b2b_contracts_price_chk" CHECK (("netUnitPrice" IS NULL OR "netUnitPrice" >= 0) AND ("commissionPct" IS NULL OR ("commissionPct" >= 0 AND "commissionPct" <= 100)) AND ("rateType" <> 'NET' OR "netUnitPrice" IS NOT NULL) AND "cutoffHours" >= 0);
