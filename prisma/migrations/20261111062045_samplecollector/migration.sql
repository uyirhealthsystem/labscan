-- AlterTable
ALTER TABLE "Sample" ALTER COLUMN "status" SET DEFAULT 'PENDING_COLLECTION';

-- CreateTable
CREATE TABLE "HomeCollectionOtpVerification" (
    "verificationId" TEXT NOT NULL,
    "homeCollectionId" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HomeCollectionOtpVerification_pkey" PRIMARY KEY ("verificationId")
);

-- CreateIndex
CREATE INDEX "HomeCollectionOtpVerification_homeCollectionId_idx" ON "HomeCollectionOtpVerification"("homeCollectionId");

-- CreateIndex
CREATE INDEX "HomeCollectionOtpVerification_expiresAt_idx" ON "HomeCollectionOtpVerification"("expiresAt");

-- AddForeignKey
ALTER TABLE "HomeCollectionOtpVerification" ADD CONSTRAINT "HomeCollectionOtpVerification_homeCollectionId_fkey" FOREIGN KEY ("homeCollectionId") REFERENCES "HomeCollection"("homeCollectionId") ON DELETE CASCADE ON UPDATE CASCADE;
