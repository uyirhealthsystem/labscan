-- CreateEnum
CREATE TYPE "ConfirmationStatus" AS ENUM ('PENDING', 'INITIATED', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "HomeCollection" ADD COLUMN     "assignmentDeadline" TIMESTAMP(3),
ADD COLUMN     "finalReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "firstReminderSentAt" TIMESTAMP(3),
ALTER COLUMN "matchingStartedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "HomeCollectionConfirmation" (
    "confirmationId" TEXT NOT NULL,
    "homeCollectionId" TEXT NOT NULL,
    "status" "ConfirmationStatus" NOT NULL DEFAULT 'PENDING',
    "recipientPhone" TEXT,
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeCollectionConfirmation_pkey" PRIMARY KEY ("confirmationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeCollectionConfirmation_homeCollectionId_key" ON "HomeCollectionConfirmation"("homeCollectionId");

-- CreateIndex
CREATE INDEX "HomeCollectionConfirmation_status_createdAt_idx" ON "HomeCollectionConfirmation"("status", "createdAt");

-- CreateIndex
CREATE INDEX "HomeCollection_assignmentDeadline_allocationStage_idx" ON "HomeCollection"("assignmentDeadline", "allocationStage");

-- AddForeignKey
ALTER TABLE "HomeCollectionConfirmation" ADD CONSTRAINT "HomeCollectionConfirmation_homeCollectionId_fkey" FOREIGN KEY ("homeCollectionId") REFERENCES "HomeCollection"("homeCollectionId") ON DELETE CASCADE ON UPDATE CASCADE;
