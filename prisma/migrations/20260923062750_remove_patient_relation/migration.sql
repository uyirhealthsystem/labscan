-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_patientId_fkey";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "patientPatientId" TEXT;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientPatientId_fkey" FOREIGN KEY ("patientPatientId") REFERENCES "Patient"("patientId") ON DELETE SET NULL ON UPDATE CASCADE;
