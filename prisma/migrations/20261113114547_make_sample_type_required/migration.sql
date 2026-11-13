-- 1. Fill in existing NULL values so the constraint won't fail
UPDATE "LabTestCatalog" SET "sampleType" = 'Blood' WHERE "sampleType" IS NULL;

-- 2. Then let Prisma's generated statement make it NOT NULL
-- (Your Prisma-generated code will be right below this)
ALTER TABLE "LabTestCatalog" ALTER COLUMN "sampleType" SET NOT NULL;