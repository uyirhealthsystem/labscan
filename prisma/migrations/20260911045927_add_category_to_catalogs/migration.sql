/*
  Warnings:

  - The values [SUSPENDED] on the enum `LabStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [SUSPENDED] on the enum `ScanCenterStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `codeSystem` on the `LabTestCatalog` table. All the data in the column will be lost.
  - You are about to drop the column `sampleType` on the `LabTestCatalog` table. All the data in the column will be lost.
  - You are about to drop the column `scanUserId` on the `ScanCenter` table. All the data in the column will be lost.
  - You are about to drop the column `codeSystem` on the `ScanServiceCatalog` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `LabTestCatalog` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `ScanServiceCatalog` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `scanCenterUserId` to the `ScanCenter` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CatalogStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('LAB', 'SCAN');

-- CreateEnum
CREATE TYPE "AppointmentMode" AS ENUM ('CENTER', 'HOME');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "AppointmentTestStatus" AS ENUM ('PENDING', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AppointmentServiceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CancellationReason" AS ENUM ('PATIENT_REQUESTED', 'PATIENT_NOT_AVAILABLE', 'INCORRECT_BOOKING_DETAILS', 'EQUIPMENT_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "HomeCollectionStatus" AS ENUM ('PENDING', 'ASSIGNED', 'EN_ROUTE', 'SAMPLE_COLLECTED', 'IN_LAB', 'PROCESSING', 'REPORT_READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CollectorStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CollectorAssignmentStatus" AS ENUM ('ASSIGNED', 'ACCEPTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HomeCollectionTrackingStatus" AS ENUM ('ASSIGNED', 'EN_ROUTE', 'SAMPLE_COLLECTED', 'IN_LAB', 'PROCESSING', 'REPORT_READY', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'UPLOADED', 'SENT');

-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('PENDING', 'EARNED', 'PAID');

-- AlterEnum
BEGIN;
CREATE TYPE "LabStatus_new" AS ENUM ('ACTIVE', 'INACTIVE');
ALTER TABLE "public"."Lab" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Lab" ALTER COLUMN "status" TYPE "LabStatus_new" USING ("status"::text::"LabStatus_new");
ALTER TYPE "LabStatus" RENAME TO "LabStatus_old";
ALTER TYPE "LabStatus_new" RENAME TO "LabStatus";
DROP TYPE "public"."LabStatus_old";
ALTER TABLE "Lab" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ScanCenterStatus_new" AS ENUM ('ACTIVE', 'INACTIVE');
ALTER TABLE "public"."ScanCenter" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ScanCenter" ALTER COLUMN "status" TYPE "ScanCenterStatus_new" USING ("status"::text::"ScanCenterStatus_new");
ALTER TYPE "ScanCenterStatus" RENAME TO "ScanCenterStatus_old";
ALTER TYPE "ScanCenterStatus_new" RENAME TO "ScanCenterStatus";
DROP TYPE "public"."ScanCenterStatus_old";
ALTER TABLE "ScanCenter" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropIndex
DROP INDEX "LabTestCatalog_codeSystem_code_key";

-- DropIndex
DROP INDEX "LabTestCatalog_code_idx";

-- DropIndex
DROP INDEX "ScanServiceCatalog_codeSystem_code_key";

-- DropIndex
DROP INDEX "ScanServiceCatalog_code_idx";

-- AlterTable
ALTER TABLE "LabTest" ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "LabTestCatalog" DROP COLUMN "codeSystem",
DROP COLUMN "sampleType",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "ScanCenter" DROP COLUMN "scanUserId",
ADD COLUMN     "scanCenterUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ScanService" ADD COLUMN     "equipmentRequired" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "homeServiceAvailable" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "ScanServiceCatalog" DROP COLUMN "codeSystem",
ADD COLUMN     "category" TEXT,
ADD COLUMN     "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "Equipment" (
    "equipmentId" TEXT NOT NULL,
    "scanCenterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "equipmentType" TEXT NOT NULL,
    "manufacturer" TEXT,
    "modelNumber" TEXT,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("equipmentId")
);

-- CreateTable
CREATE TABLE "EquipmentService" (
    "equipmentServiceId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "scanServiceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentService_pkey" PRIMARY KEY ("equipmentServiceId")
);

-- CreateTable
CREATE TABLE "Patient" (
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "Gender",
    "age" INTEGER,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("patientId")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "appointmentId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "labId" TEXT,
    "scanCenterId" TEXT,
    "appointmentType" "AppointmentType" NOT NULL,
    "appointmentMode" "AppointmentMode" NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "patientNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("appointmentId")
);

-- CreateTable
CREATE TABLE "AppointmentTest" (
    "appointmentTestId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "labTestId" TEXT NOT NULL,
    "price" DECIMAL(65,30),
    "status" "AppointmentTestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentTest_pkey" PRIMARY KEY ("appointmentTestId")
);

-- CreateTable
CREATE TABLE "AppointmentService" (
    "appointmentServiceId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "scanServiceId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "price" DECIMAL(65,30),
    "status" "AppointmentServiceStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentService_pkey" PRIMARY KEY ("appointmentServiceId")
);

-- CreateTable
CREATE TABLE "Cancellation" (
    "cancellationId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "reason" "CancellationReason" NOT NULL,
    "additionalNotes" TEXT,
    "cancelledBy" TEXT,
    "cancelledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cancellation_pkey" PRIMARY KEY ("cancellationId")
);

-- CreateTable
CREATE TABLE "Reschedule" (
    "rescheduleId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "oldDate" TIMESTAMP(3) NOT NULL,
    "oldStartTime" TIMESTAMP(3) NOT NULL,
    "oldEndTime" TIMESTAMP(3) NOT NULL,
    "newDate" TIMESTAMP(3) NOT NULL,
    "newStartTime" TIMESTAMP(3) NOT NULL,
    "newEndTime" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "rescheduledBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reschedule_pkey" PRIMARY KEY ("rescheduleId")
);

-- CreateTable
CREATE TABLE "HomeCollection" (
    "homeCollectionId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "specialInstructions" TEXT,
    "status" "HomeCollectionStatus" NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3),
    "collectedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeCollection_pkey" PRIMARY KEY ("homeCollectionId")
);

-- CreateTable
CREATE TABLE "Collector" (
    "collectorId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "status" "CollectorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collector_pkey" PRIMARY KEY ("collectorId")
);

-- CreateTable
CREATE TABLE "CollectorAssignment" (
    "collectorAssignmentId" TEXT NOT NULL,
    "homeCollectionId" TEXT NOT NULL,
    "collectorId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CollectorAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',

    CONSTRAINT "CollectorAssignment_pkey" PRIMARY KEY ("collectorAssignmentId")
);

-- CreateTable
CREATE TABLE "HomeCollectionTracking" (
    "trackingId" TEXT NOT NULL,
    "homeCollectionId" TEXT NOT NULL,
    "status" "HomeCollectionTrackingStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeCollectionTracking_pkey" PRIMARY KEY ("trackingId")
);

-- CreateTable
CREATE TABLE "Report" (
    "reportId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "reportNotes" TEXT,
    "uploadedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "notifyPatient" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("reportId")
);

-- CreateTable
CREATE TABLE "ReportFile" (
    "reportFileId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportFile_pkey" PRIMARY KEY ("reportFileId")
);

-- CreateTable
CREATE TABLE "Earning" (
    "earningId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "EarningStatus" NOT NULL DEFAULT 'PENDING',
    "earnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Earning_pkey" PRIMARY KEY ("earningId")
);

-- CreateIndex
CREATE INDEX "Equipment_scanCenterId_idx" ON "Equipment"("scanCenterId");

-- CreateIndex
CREATE INDEX "Equipment_equipmentType_idx" ON "Equipment"("equipmentType");

-- CreateIndex
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");

-- CreateIndex
CREATE INDEX "EquipmentService_equipmentId_idx" ON "EquipmentService"("equipmentId");

-- CreateIndex
CREATE INDEX "EquipmentService_scanServiceId_idx" ON "EquipmentService"("scanServiceId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentService_equipmentId_scanServiceId_key" ON "EquipmentService"("equipmentId", "scanServiceId");

-- CreateIndex
CREATE INDEX "Patient_name_idx" ON "Patient"("name");

-- CreateIndex
CREATE INDEX "Patient_phone_idx" ON "Patient"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_bookingId_key" ON "Appointment"("bookingId");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_labId_idx" ON "Appointment"("labId");

-- CreateIndex
CREATE INDEX "Appointment_scanCenterId_idx" ON "Appointment"("scanCenterId");

-- CreateIndex
CREATE INDEX "Appointment_appointmentDate_idx" ON "Appointment"("appointmentDate");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "Appointment_appointmentType_idx" ON "Appointment"("appointmentType");

-- CreateIndex
CREATE INDEX "Appointment_appointmentMode_idx" ON "Appointment"("appointmentMode");

-- CreateIndex
CREATE INDEX "AppointmentTest_appointmentId_idx" ON "AppointmentTest"("appointmentId");

-- CreateIndex
CREATE INDEX "AppointmentTest_labTestId_idx" ON "AppointmentTest"("labTestId");

-- CreateIndex
CREATE INDEX "AppointmentTest_status_idx" ON "AppointmentTest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentTest_appointmentId_labTestId_key" ON "AppointmentTest"("appointmentId", "labTestId");

-- CreateIndex
CREATE INDEX "AppointmentService_appointmentId_idx" ON "AppointmentService"("appointmentId");

-- CreateIndex
CREATE INDEX "AppointmentService_scanServiceId_idx" ON "AppointmentService"("scanServiceId");

-- CreateIndex
CREATE INDEX "AppointmentService_equipmentId_idx" ON "AppointmentService"("equipmentId");

-- CreateIndex
CREATE INDEX "AppointmentService_status_idx" ON "AppointmentService"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentService_appointmentId_scanServiceId_key" ON "AppointmentService"("appointmentId", "scanServiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Cancellation_appointmentId_key" ON "Cancellation"("appointmentId");

-- CreateIndex
CREATE INDEX "Cancellation_reason_idx" ON "Cancellation"("reason");

-- CreateIndex
CREATE INDEX "Cancellation_cancelledAt_idx" ON "Cancellation"("cancelledAt");

-- CreateIndex
CREATE INDEX "Reschedule_appointmentId_idx" ON "Reschedule"("appointmentId");

-- CreateIndex
CREATE INDEX "Reschedule_newDate_idx" ON "Reschedule"("newDate");

-- CreateIndex
CREATE UNIQUE INDEX "HomeCollection_appointmentId_key" ON "HomeCollection"("appointmentId");

-- CreateIndex
CREATE INDEX "HomeCollection_status_idx" ON "HomeCollection"("status");

-- CreateIndex
CREATE INDEX "HomeCollection_createdAt_idx" ON "HomeCollection"("createdAt");

-- CreateIndex
CREATE INDEX "Collector_labId_idx" ON "Collector"("labId");

-- CreateIndex
CREATE INDEX "Collector_status_idx" ON "Collector"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CollectorAssignment_homeCollectionId_key" ON "CollectorAssignment"("homeCollectionId");

-- CreateIndex
CREATE INDEX "CollectorAssignment_collectorId_idx" ON "CollectorAssignment"("collectorId");

-- CreateIndex
CREATE INDEX "CollectorAssignment_status_idx" ON "CollectorAssignment"("status");

-- CreateIndex
CREATE INDEX "HomeCollectionTracking_homeCollectionId_idx" ON "HomeCollectionTracking"("homeCollectionId");

-- CreateIndex
CREATE INDEX "HomeCollectionTracking_status_idx" ON "HomeCollectionTracking"("status");

-- CreateIndex
CREATE INDEX "HomeCollectionTracking_createdAt_idx" ON "HomeCollectionTracking"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Report_appointmentId_key" ON "Report"("appointmentId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_uploadedAt_idx" ON "Report"("uploadedAt");

-- CreateIndex
CREATE INDEX "Report_sentAt_idx" ON "Report"("sentAt");

-- CreateIndex
CREATE INDEX "ReportFile_reportId_idx" ON "ReportFile"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "Earning_appointmentId_key" ON "Earning"("appointmentId");

-- CreateIndex
CREATE INDEX "Earning_status_idx" ON "Earning"("status");

-- CreateIndex
CREATE INDEX "Earning_earnedAt_idx" ON "Earning"("earnedAt");

-- CreateIndex
CREATE INDEX "Lab_labUserId_idx" ON "Lab"("labUserId");

-- CreateIndex
CREATE UNIQUE INDEX "LabTestCatalog_code_key" ON "LabTestCatalog"("code");

-- CreateIndex
CREATE INDEX "LabTestCatalog_name_idx" ON "LabTestCatalog"("name");

-- CreateIndex
CREATE INDEX "LabTestCatalog_category_idx" ON "LabTestCatalog"("category");

-- CreateIndex
CREATE INDEX "LabTestCatalog_status_idx" ON "LabTestCatalog"("status");

-- CreateIndex
CREATE INDEX "ScanCenter_scanCenterUserId_idx" ON "ScanCenter"("scanCenterUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ScanServiceCatalog_code_key" ON "ScanServiceCatalog"("code");

-- CreateIndex
CREATE INDEX "ScanServiceCatalog_name_idx" ON "ScanServiceCatalog"("name");

-- CreateIndex
CREATE INDEX "ScanServiceCatalog_category_idx" ON "ScanServiceCatalog"("category");

-- CreateIndex
CREATE INDEX "ScanServiceCatalog_status_idx" ON "ScanServiceCatalog"("status");

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_scanCenterId_fkey" FOREIGN KEY ("scanCenterId") REFERENCES "ScanCenter"("scanCenterId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentService" ADD CONSTRAINT "EquipmentService_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("equipmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentService" ADD CONSTRAINT "EquipmentService_scanServiceId_fkey" FOREIGN KEY ("scanServiceId") REFERENCES "ScanService"("scanServiceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("patientId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("labId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_scanCenterId_fkey" FOREIGN KEY ("scanCenterId") REFERENCES "ScanCenter"("scanCenterId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentTest" ADD CONSTRAINT "AppointmentTest_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("appointmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentTest" ADD CONSTRAINT "AppointmentTest_labTestId_fkey" FOREIGN KEY ("labTestId") REFERENCES "LabTest"("labTestId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("appointmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_scanServiceId_fkey" FOREIGN KEY ("scanServiceId") REFERENCES "ScanService"("scanServiceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("equipmentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("appointmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reschedule" ADD CONSTRAINT "Reschedule_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("appointmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeCollection" ADD CONSTRAINT "HomeCollection_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("appointmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectorAssignment" ADD CONSTRAINT "CollectorAssignment_homeCollectionId_fkey" FOREIGN KEY ("homeCollectionId") REFERENCES "HomeCollection"("homeCollectionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectorAssignment" ADD CONSTRAINT "CollectorAssignment_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "Collector"("collectorId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeCollectionTracking" ADD CONSTRAINT "HomeCollectionTracking_homeCollectionId_fkey" FOREIGN KEY ("homeCollectionId") REFERENCES "HomeCollection"("homeCollectionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("appointmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportFile" ADD CONSTRAINT "ReportFile_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("reportId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("appointmentId") ON DELETE CASCADE ON UPDATE CASCADE;
