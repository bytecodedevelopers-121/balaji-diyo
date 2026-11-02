-- Human-readable "BA-<number>" booking reference (client direct request:
-- "booking Code BA-... name and numbers 1443 mathi hunu parxa" — the
-- number must start above 1443, not restart from 1). `bookingNumber` is
-- a plain auto-incrementing integer; the app formats it as `BA-<n>`.
--
-- AddColumn (SERIAL backfills existing rows off the new sequence,
-- starting at 1, before the RESTART below moves the *next* value up to
-- 1444 for every booking created from here on).
ALTER TABLE "bookings" ADD COLUMN "bookingNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bookingNumber_key" ON "bookings"("bookingNumber");

-- The very next booking created gets bookingNumber = 1444, regardless of
-- how many existing rows the backfill above already numbered 1, 2, 3, ...
ALTER SEQUENCE "bookings_bookingNumber_seq" RESTART WITH 1444;
