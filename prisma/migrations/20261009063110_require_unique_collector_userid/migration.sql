/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Collector` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Collector_userId_key" ON "Collector"("userId");
