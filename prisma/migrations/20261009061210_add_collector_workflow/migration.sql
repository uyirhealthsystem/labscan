-- CreateEnum
CREATE TYPE "SampleEvidenceType" AS ENUM ('COLLECTION_PHOTO', 'DELIVERY_PROOF');

-- AlterEnum
ALTER TYPE "CollectorAssignmentStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Collector" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "SampleEvidence" (
    "evidenceId" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "collectorId" TEXT,
    "type" "SampleEvidenceType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SampleEvidence_pkey" PRIMARY KEY ("evidenceId")
);

-- CreateIndex
CREATE INDEX "SampleEvidence_sampleId_idx" ON "SampleEvidence"("sampleId");

-- CreateIndex
CREATE INDEX "SampleEvidence_collectorId_idx" ON "SampleEvidence"("collectorId");

-- CreateIndex
CREATE INDEX "SampleEvidence_type_idx" ON "SampleEvidence"("type");

-- AddForeignKey
ALTER TABLE "SampleEvidence" ADD CONSTRAINT "SampleEvidence_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("sampleId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleEvidence" ADD CONSTRAINT "SampleEvidence_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("collectorId") ON DELETE SET NULL ON UPDATE CASCADE;
