-- CreateEnum
CREATE TYPE "CollectorType" AS ENUM ('LAB', 'INDEPENDENT');

-- CreateEnum
CREATE TYPE "CollectorLabApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CollectorBookingOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CollectionAllocationStage" AS ENUM ('LAB_COLLECTORS', 'INDEPENDENT_POOL', 'ASSIGNED');

-- CreateEnum
CREATE TYPE "CollectorAssignmentSource" AS ENUM ('LAB_INTERNAL', 'INDEPENDENT_POOL');

-- DropForeignKey
ALTER TABLE "Collector" DROP CONSTRAINT "Collector_labId_fkey";

-- DropIndex
DROP INDEX "Collector_role_idx";

-- AlterTable
ALTER TABLE "Collector" ADD COLUMN     "collectorType" "CollectorType" NOT NULL DEFAULT 'LAB',
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLocationAt" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ALTER COLUMN "labId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CollectorAssignment" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "source" "CollectorAssignmentSource" NOT NULL DEFAULT 'LAB_INTERNAL';

-- AlterTable
ALTER TABLE "HomeCollection" ADD COLUMN     "allocationStage" "CollectionAllocationStage" NOT NULL DEFAULT 'LAB_COLLECTORS',
ADD COLUMN     "independentEscalatedAt" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "matchingStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "CollectorLabApproval" (
    "approvalId" TEXT NOT NULL,
    "collectorId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "status" "CollectorLabApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectorLabApproval_pkey" PRIMARY KEY ("approvalId")
);

-- CreateTable
CREATE TABLE "CollectorBookingOffer" (
    "offerId" TEXT NOT NULL,
    "homeCollectionId" TEXT NOT NULL,
    "collectorId" TEXT NOT NULL,
    "status" "CollectorBookingOfferStatus" NOT NULL DEFAULT 'PENDING',
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "offeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "CollectorBookingOffer_pkey" PRIMARY KEY ("offerId")
);

-- CreateIndex
CREATE INDEX "CollectorLabApproval_labId_status_idx" ON "CollectorLabApproval"("labId", "status");

-- CreateIndex
CREATE INDEX "CollectorLabApproval_collectorId_status_idx" ON "CollectorLabApproval"("collectorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CollectorLabApproval_collectorId_labId_key" ON "CollectorLabApproval"("collectorId", "labId");

-- CreateIndex
CREATE INDEX "CollectorBookingOffer_collectorId_status_idx" ON "CollectorBookingOffer"("collectorId", "status");

-- CreateIndex
CREATE INDEX "CollectorBookingOffer_homeCollectionId_status_idx" ON "CollectorBookingOffer"("homeCollectionId", "status");

-- CreateIndex
CREATE INDEX "CollectorBookingOffer_status_expiresAt_idx" ON "CollectorBookingOffer"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CollectorBookingOffer_homeCollectionId_collectorId_key" ON "CollectorBookingOffer"("homeCollectionId", "collectorId");

-- CreateIndex
CREATE INDEX "Collector_collectorType_idx" ON "Collector"("collectorType");

-- CreateIndex
CREATE INDEX "Collector_isAvailable_idx" ON "Collector"("isAvailable");

-- CreateIndex
CREATE INDEX "Collector_latitude_longitude_idx" ON "Collector"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "CollectorAssignment_source_idx" ON "CollectorAssignment"("source");

-- CreateIndex
CREATE INDEX "HomeCollection_allocationStage_idx" ON "HomeCollection"("allocationStage");

-- CreateIndex
CREATE INDEX "HomeCollection_matchingStartedAt_idx" ON "HomeCollection"("matchingStartedAt");

-- CreateIndex
CREATE INDEX "HomeCollection_latitude_longitude_idx" ON "HomeCollection"("latitude", "longitude");

-- AddForeignKey
ALTER TABLE "Collector" ADD CONSTRAINT "Collector_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("labId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectorLabApproval" ADD CONSTRAINT "CollectorLabApproval_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("collectorId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectorLabApproval" ADD CONSTRAINT "CollectorLabApproval_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("labId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectorBookingOffer" ADD CONSTRAINT "CollectorBookingOffer_homeCollectionId_fkey" FOREIGN KEY ("homeCollectionId") REFERENCES "HomeCollection"("homeCollectionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectorBookingOffer" ADD CONSTRAINT "CollectorBookingOffer_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("collectorId") ON DELETE CASCADE ON UPDATE CASCADE;
