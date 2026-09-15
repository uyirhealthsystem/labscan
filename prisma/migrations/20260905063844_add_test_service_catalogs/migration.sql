/*
  Warnings:

  - You are about to drop the column `code` on the `LabTest` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `LabTest` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `LabTest` table. All the data in the column will be lost.
  - You are about to drop the column `sampleType` on the `LabTest` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `ScanService` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `ScanService` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ScanService` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[labId,testCatalogId]` on the table `LabTest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[scanCenterId,serviceCatalogId]` on the table `ScanService` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `testCatalogId` to the `LabTest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceCatalogId` to the `ScanService` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "LabTest_labId_name_key";

-- DropIndex
DROP INDEX "ScanService_scanCenterId_name_key";

-- AlterTable
ALTER TABLE "LabTest" DROP COLUMN "code",
DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "sampleType",
ADD COLUMN     "testCatalogId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ScanService" DROP COLUMN "code",
DROP COLUMN "description",
DROP COLUMN "name",
ADD COLUMN     "serviceCatalogId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "LabTestCatalog" (
    "testCatalogId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "codeSystem" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sampleType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTestCatalog_pkey" PRIMARY KEY ("testCatalogId")
);

-- CreateTable
CREATE TABLE "ScanServiceCatalog" (
    "serviceCatalogId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "codeSystem" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanServiceCatalog_pkey" PRIMARY KEY ("serviceCatalogId")
);

-- CreateIndex
CREATE INDEX "LabTestCatalog_code_idx" ON "LabTestCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LabTestCatalog_codeSystem_code_key" ON "LabTestCatalog"("codeSystem", "code");

-- CreateIndex
CREATE INDEX "ScanServiceCatalog_code_idx" ON "ScanServiceCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ScanServiceCatalog_codeSystem_code_key" ON "ScanServiceCatalog"("codeSystem", "code");

-- CreateIndex
CREATE INDEX "LabTest_testCatalogId_idx" ON "LabTest"("testCatalogId");

-- CreateIndex
CREATE UNIQUE INDEX "LabTest_labId_testCatalogId_key" ON "LabTest"("labId", "testCatalogId");

-- CreateIndex
CREATE INDEX "ScanService_serviceCatalogId_idx" ON "ScanService"("serviceCatalogId");

-- CreateIndex
CREATE UNIQUE INDEX "ScanService_scanCenterId_serviceCatalogId_key" ON "ScanService"("scanCenterId", "serviceCatalogId");

-- AddForeignKey
ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_testCatalogId_fkey" FOREIGN KEY ("testCatalogId") REFERENCES "LabTestCatalog"("testCatalogId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanService" ADD CONSTRAINT "ScanService_serviceCatalogId_fkey" FOREIGN KEY ("serviceCatalogId") REFERENCES "ScanServiceCatalog"("serviceCatalogId") ON DELETE RESTRICT ON UPDATE CASCADE;
