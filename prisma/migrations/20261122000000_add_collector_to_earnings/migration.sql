ALTER TABLE "Earning" ADD COLUMN "collectorId" TEXT;

CREATE INDEX "Earning_collectorId_idx" ON "Earning"("collectorId");

ALTER TABLE "Earning"
  ADD CONSTRAINT "Earning_collectorId_fkey"
  FOREIGN KEY ("collectorId")
  REFERENCES "Collector"("collectorId")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
