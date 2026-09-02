-- AlterTable Asset: add exchange/currency
ALTER TABLE "Asset" ADD COLUMN "exchange" VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "Asset" ADD COLUMN "currency" VARCHAR(10) NOT NULL DEFAULT 'USD';

-- Alter industry to VARCHAR(100) if needed (no-op if already)
-- ALTER TABLE "Asset" ALTER COLUMN "industry" TYPE VARCHAR(100);

-- CreateIndex
CREATE INDEX "Asset_exchange_idx" ON "Asset"("exchange");
CREATE INDEX "Asset_sector_exchange_idx" ON "Asset"("sector", "exchange");
