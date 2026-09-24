-- CreateEnum
CREATE TYPE "BankAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SupportTicketCategory" AS ENUM ('BOOKING', 'REPORT', 'PAYMENT', 'TECHNICAL', 'ACCOUNT', 'OTHER');

-- CreateTable
CREATE TABLE "TimeSlot" (
    "timeSlotId" TEXT NOT NULL,
    "labId" TEXT,
    "scanCenterId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("timeSlotId")
);

-- CreateTable
CREATE TABLE "ProviderBankAccount" (
    "bankAccountId" TEXT NOT NULL,
    "labId" TEXT,
    "scanCenterId" TEXT,
    "accountHolderName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "bankName" TEXT,
    "branchName" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "BankAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderBankAccount_pkey" PRIMARY KEY ("bankAccountId")
);

-- CreateTable
CREATE TABLE "Payout" (
    "payoutId" TEXT NOT NULL,
    "labId" TEXT,
    "scanCenterId" TEXT,
    "bankAccountId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "failureReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("payoutId")
);

-- CreateTable
CREATE TABLE "ProviderSettings" (
    "settingsId" TEXT NOT NULL,
    "labId" TEXT,
    "scanCenterId" TEXT,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "bookingNotifications" BOOLEAN NOT NULL DEFAULT true,
    "reportNotifications" BOOLEAN NOT NULL DEFAULT true,
    "payoutNotifications" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderSettings_pkey" PRIMARY KEY ("settingsId")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "ticketId" TEXT NOT NULL,
    "labId" TEXT,
    "scanCenterId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "SupportTicketCategory" NOT NULL DEFAULT 'OTHER',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("ticketId")
);

-- CreateIndex
CREATE INDEX "TimeSlot_labId_idx" ON "TimeSlot"("labId");

-- CreateIndex
CREATE INDEX "TimeSlot_scanCenterId_idx" ON "TimeSlot"("scanCenterId");

-- CreateIndex
CREATE INDEX "TimeSlot_date_idx" ON "TimeSlot"("date");

-- CreateIndex
CREATE INDEX "TimeSlot_isAvailable_idx" ON "TimeSlot"("isAvailable");

-- CreateIndex
CREATE INDEX "TimeSlot_date_startTime_endTime_idx" ON "TimeSlot"("date", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "ProviderBankAccount_labId_idx" ON "ProviderBankAccount"("labId");

-- CreateIndex
CREATE INDEX "ProviderBankAccount_scanCenterId_idx" ON "ProviderBankAccount"("scanCenterId");

-- CreateIndex
CREATE INDEX "ProviderBankAccount_status_idx" ON "ProviderBankAccount"("status");

-- CreateIndex
CREATE INDEX "ProviderBankAccount_isPrimary_idx" ON "ProviderBankAccount"("isPrimary");

-- CreateIndex
CREATE INDEX "Payout_labId_idx" ON "Payout"("labId");

-- CreateIndex
CREATE INDEX "Payout_scanCenterId_idx" ON "Payout"("scanCenterId");

-- CreateIndex
CREATE INDEX "Payout_bankAccountId_idx" ON "Payout"("bankAccountId");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- CreateIndex
CREATE INDEX "Payout_requestedAt_idx" ON "Payout"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderSettings_labId_key" ON "ProviderSettings"("labId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderSettings_scanCenterId_key" ON "ProviderSettings"("scanCenterId");

-- CreateIndex
CREATE INDEX "SupportTicket_labId_idx" ON "SupportTicket"("labId");

-- CreateIndex
CREATE INDEX "SupportTicket_scanCenterId_idx" ON "SupportTicket"("scanCenterId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_priority_idx" ON "SupportTicket"("priority");

-- CreateIndex
CREATE INDEX "SupportTicket_category_idx" ON "SupportTicket"("category");

-- CreateIndex
CREATE INDEX "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("labId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_scanCenterId_fkey" FOREIGN KEY ("scanCenterId") REFERENCES "ScanCenter"("scanCenterId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderBankAccount" ADD CONSTRAINT "ProviderBankAccount_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("labId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderBankAccount" ADD CONSTRAINT "ProviderBankAccount_scanCenterId_fkey" FOREIGN KEY ("scanCenterId") REFERENCES "ScanCenter"("scanCenterId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("labId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_scanCenterId_fkey" FOREIGN KEY ("scanCenterId") REFERENCES "ScanCenter"("scanCenterId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "ProviderBankAccount"("bankAccountId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderSettings" ADD CONSTRAINT "ProviderSettings_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("labId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderSettings" ADD CONSTRAINT "ProviderSettings_scanCenterId_fkey" FOREIGN KEY ("scanCenterId") REFERENCES "ScanCenter"("scanCenterId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("labId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_scanCenterId_fkey" FOREIGN KEY ("scanCenterId") REFERENCES "ScanCenter"("scanCenterId") ON DELETE CASCADE ON UPDATE CASCADE;
