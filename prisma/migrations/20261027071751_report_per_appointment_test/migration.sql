/*
  Warnings:

  - A unique constraint covering the columns `[appointmentTestId]` on the table `Report` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Report_appointmentId_key";

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "appointmentTestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Report_appointmentTestId_key" ON "Report"("appointmentTestId");

-- CreateIndex
CREATE INDEX "Report_appointmentId_idx" ON "Report"("appointmentId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_appointmentTestId_fkey" FOREIGN KEY ("appointmentTestId") REFERENCES "AppointmentTest"("appointmentTestId") ON DELETE CASCADE ON UPDATE CASCADE;
