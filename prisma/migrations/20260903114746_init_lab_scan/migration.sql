-- CreateEnum
CREATE TYPE "LabStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "LabTestStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ScanCenterStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ScanServiceStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "Lab" (
    "labId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "districtId" TEXT,
    "status" "LabStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lab_pkey" PRIMARY KEY ("labId")
);

-- CreateTable
CREATE TABLE "LabTest" (
    "labTestId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "sampleType" TEXT,
    "price" DECIMAL(10,2),
    "turnaroundTime" INTEGER,
    "status" "LabTestStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTest_pkey" PRIMARY KEY ("labTestId")
);

-- CreateTable
CREATE TABLE "ScanCenter" (
    "scanCenterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "districtId" TEXT,
    "status" "ScanCenterStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanCenter_pkey" PRIMARY KEY ("scanCenterId")
);

-- CreateTable
CREATE TABLE "ScanService" (
    "scanServiceId" TEXT NOT NULL,
    "scanCenterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "price" DECIMAL(10,2),
    "turnaroundTime" INTEGER,
    "status" "ScanServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanService_pkey" PRIMARY KEY ("scanServiceId")
);

-- CreateIndex
CREATE INDEX "Lab_districtId_idx" ON "Lab"("districtId");

-- CreateIndex
CREATE INDEX "Lab_status_idx" ON "Lab"("status");

-- CreateIndex
CREATE INDEX "Lab_registrationNumber_idx" ON "Lab"("registrationNumber");

-- CreateIndex
CREATE INDEX "LabTest_labId_idx" ON "LabTest"("labId");

-- CreateIndex
CREATE INDEX "LabTest_status_idx" ON "LabTest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LabTest_labId_name_key" ON "LabTest"("labId", "name");

-- CreateIndex
CREATE INDEX "ScanCenter_districtId_idx" ON "ScanCenter"("districtId");

-- CreateIndex
CREATE INDEX "ScanCenter_status_idx" ON "ScanCenter"("status");

-- CreateIndex
CREATE INDEX "ScanCenter_registrationNumber_idx" ON "ScanCenter"("registrationNumber");

-- CreateIndex
CREATE INDEX "ScanService_scanCenterId_idx" ON "ScanService"("scanCenterId");

-- CreateIndex
CREATE INDEX "ScanService_status_idx" ON "ScanService"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ScanService_scanCenterId_name_key" ON "ScanService"("scanCenterId", "name");

-- AddForeignKey
ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("labId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanService" ADD CONSTRAINT "ScanService_scanCenterId_fkey" FOREIGN KEY ("scanCenterId") REFERENCES "ScanCenter"("scanCenterId") ON DELETE CASCADE ON UPDATE CASCADE;
