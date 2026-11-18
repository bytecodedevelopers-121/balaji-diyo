-- AlterTable: which group of the Legal Documents page a document belongs to ("legal" or "association").
ALTER TABLE "company_documents" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'legal';

-- Keep existing documents where the website already showed them (it grouped by title keywords).
UPDATE "company_documents" SET "category" = 'association' WHERE "title" ~* 'associat|membership|board|federation|union';
