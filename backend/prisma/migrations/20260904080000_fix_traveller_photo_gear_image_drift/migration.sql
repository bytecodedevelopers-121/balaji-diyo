-- Fixes migration drift: these two columns exist in schema.prisma (added in
-- commit ab2c142, "new changes") and were already present on the dev DB
-- (applied there via `prisma db push` / a manual ALTER, not a tracked
-- migration), but were never captured in a migration file — so
-- `prisma migrate deploy` never created them anywhere else, including
-- production. See: "column travellers.photo does not exist" on
-- prisma.booking.create().

-- AlterTable
ALTER TABLE "travellers" ADD COLUMN "photo" TEXT;

-- AlterTable
ALTER TABLE "package_gear_items" ADD COLUMN "imageUrl" TEXT;
