/*
  Warnings:

  - Added the required column `labUserId` to the `Lab` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scanUserId` to the `ScanCenter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lab" ADD COLUMN     "labUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ScanCenter" ADD COLUMN     "scanUserId" TEXT NOT NULL;
