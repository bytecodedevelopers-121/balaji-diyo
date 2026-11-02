-- Server-resolved IP geolocation for an enquiry (client direct request
-- 2026-09-07: "country and ip address and country code should go to
-- admin mail"). Both columns are nullable and populated by the app
-- layer (see `lib/ip-geolocation.ts`), not migrated/backfilled here —
-- existing rows simply have no geolocation on file, same as they
-- already have no `ipAddress` from before that column existed either.

-- AlterTable
ALTER TABLE "contact_messages" ADD COLUMN "country" TEXT,
ADD COLUMN "countryCode" TEXT;
