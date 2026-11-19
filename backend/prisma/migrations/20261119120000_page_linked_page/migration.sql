-- AlterTable: an optional "continue to" link from a CMS page to another page of the website.
ALTER TABLE "pages" ADD COLUMN "linkedPagePath" TEXT;
ALTER TABLE "pages" ADD COLUMN "linkedPageLabel" TEXT;
