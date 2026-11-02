-- Admin-editable "Published" date for packages, distinct from `createdAt`
-- (which never changes) — same idea as blog's real `blogDate` field, so an
-- admin isn't stuck showing the record's creation timestamp forever.
--
-- Existing rows are backfilled from their own `createdAt` rather than left
-- at this migration's run date, so packages already in the admin list keep
-- showing the date they actually already showed (createdAt) instead of
-- jumping to "today".

-- AlterTable
ALTER TABLE "packages" ADD COLUMN "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill: existing rows get their own createdAt, not the migration date.
UPDATE "packages" SET "publishedAt" = "createdAt";
