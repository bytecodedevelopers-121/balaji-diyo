CREATE TYPE "AddOnChargeBy" AS ENUM ('PERSON', 'ROOM', 'FLAT');

ALTER TABLE "package_addons"
  ADD COLUMN "chargeBy" "AddOnChargeBy" NOT NULL DEFAULT 'PERSON',
  ADD COLUMN "peoplePerRoom" INTEGER NOT NULL DEFAULT 2;

-- Backfill from the legacy free-text titles/units.
UPDATE "package_addons" SET "chargeBy" = 'ROOM'
  WHERE "addonTitle" ~* '(hotel|accommodation|room)' OR "addonUnit" ~* 'room';
UPDATE "package_addons" SET "chargeBy" = 'FLAT'
  WHERE "chargeBy" = 'PERSON' AND "addonUnit" ~* '(jeep|car|group)';
