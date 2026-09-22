-- CreateEnum
CREATE TYPE "CollectorRole" AS ENUM ('NURSE', 'TECHNICIAN');

-- CreateEnum
CREATE TYPE "QualificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FastingRequirement" AS ENUM ('NOT_REQUIRED', 'REQUIRED', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "SampleStatus" AS ENUM ('COLLECTED', 'IN_TRANSIT', 'RECEIVED', 'PROCESSING', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SampleCondition" AS ENUM ('GOOD', 'DAMAGED', 'LEAKED', 'INSUFFICIENT', 'HEMOLYZED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SampleTrackingStatus" AS ENUM ('BARCODE_SCANNED', 'COLLECTED', 'IN_TRANSIT', 'RECEIVED_AT_LAB', 'ACCEPTED', 'REJECTED', 'PROCESSING_STARTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SampleOtpPurpose" AS ENUM ('COLLECTION_VERIFICATION', 'SAMPLE_HANDOVER');

-- AlterTable
ALTER TABLE "AppointmentTest" ADD COLUMN     "fastingHours" INTEGER,
ADD COLUMN     "fastingRequirement" "FastingRequirement",
ADD COLUMN     "preparationInstructions" TEXT;

-- AlterTable
ALTER TABLE "Collector" ADD COLUMN     "qualification" TEXT,
ADD COLUMN     "qualificationNumber" TEXT,
ADD COLUMN     "qualificationProofUrl" TEXT,
ADD COLUMN     "qualificationStatus" "QualificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "role" "CollectorRole" NOT NULL DEFAULT 'TECHNICIAN';

-- AlterTable
ALTER TABLE "LabTestCatalog" ADD COLUMN     "fastingHours" INTEGER,
ADD COLUMN     "fastingRequirement" "FastingRequirement" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN     "preparationInstructions" TEXT;

-- CreateTable
CREATE TABLE "Sample" (
    "sampleId" TEXT NOT NULL,
    "appointmentTestId" TEXT NOT NULL,
    "homeCollectionId" TEXT,
    "collectorId" TEXT,
    "barcode" TEXT NOT NULL,
    "sampleType" TEXT NOT NULL,
    "containerType" TEXT,
    "status" "SampleStatus" NOT NULL DEFAULT 'COLLECTED',
    "collectedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "condition" "SampleCondition" NOT NULL DEFAULT 'GOOD',
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sample_pkey" PRIMARY KEY ("sampleId")
);

-- CreateTable
CREATE TABLE "SampleTracking" (
    "sampleTrackingId" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "status" "SampleTrackingStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SampleTracking_pkey" PRIMARY KEY ("sampleTrackingId")
);

-- CreateTable
CREATE TABLE "SampleOtpVerification" (
    "verificationId" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "purpose" "SampleOtpPurpose" NOT NULL DEFAULT 'COLLECTION_VERIFICATION',
    "otpHash" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SampleOtpVerification_pkey" PRIMARY KEY ("verificationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sample_barcode_key" ON "Sample"("barcode");

-- CreateIndex
CREATE INDEX "Sample_appointmentTestId_idx" ON "Sample"("appointmentTestId");

-- CreateIndex
CREATE INDEX "Sample_homeCollectionId_idx" ON "Sample"("homeCollectionId");

-- CreateIndex
CREATE INDEX "Sample_collectorId_idx" ON "Sample"("collectorId");

-- CreateIndex
CREATE INDEX "Sample_status_idx" ON "Sample"("status");

-- CreateIndex
CREATE INDEX "Sample_barcode_idx" ON "Sample"("barcode");

-- CreateIndex
CREATE INDEX "SampleTracking_sampleId_idx" ON "SampleTracking"("sampleId");

-- CreateIndex
CREATE INDEX "SampleTracking_status_idx" ON "SampleTracking"("status");

-- CreateIndex
CREATE INDEX "SampleTracking_createdAt_idx" ON "SampleTracking"("createdAt");

-- CreateIndex
CREATE INDEX "SampleOtpVerification_sampleId_idx" ON "SampleOtpVerification"("sampleId");

-- CreateIndex
CREATE INDEX "SampleOtpVerification_expiresAt_idx" ON "SampleOtpVerification"("expiresAt");

-- CreateIndex
CREATE INDEX "SampleOtpVerification_purpose_idx" ON "SampleOtpVerification"("purpose");

-- CreateIndex
CREATE INDEX "Collector_role_idx" ON "Collector"("role");

-- CreateIndex
CREATE INDEX "Collector_qualificationStatus_idx" ON "Collector"("qualificationStatus");

-- CreateIndex
CREATE INDEX "LabTestCatalog_fastingRequirement_idx" ON "LabTestCatalog"("fastingRequirement");

-- AddForeignKey
ALTER TABLE "Collector" ADD CONSTRAINT "Collector_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("labId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_appointmentTestId_fkey" FOREIGN KEY ("appointmentTestId") REFERENCES "AppointmentTest"("appointmentTestId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_homeCollectionId_fkey" FOREIGN KEY ("homeCollectionId") REFERENCES "HomeCollection"("homeCollectionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("collectorId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleTracking" ADD CONSTRAINT "SampleTracking_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("sampleId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleOtpVerification" ADD CONSTRAINT "SampleOtpVerification_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("sampleId") ON DELETE CASCADE ON UPDATE CASCADE;
