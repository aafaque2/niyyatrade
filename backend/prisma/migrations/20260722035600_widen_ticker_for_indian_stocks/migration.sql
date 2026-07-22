-- AlterTables: Widen ticker columns from VARCHAR(10) to VARCHAR(20) for Indian stock tickers
ALTER TABLE "Asset" ALTER COLUMN "ticker" TYPE VARCHAR(20);
ALTER TABLE "Order" ALTER COLUMN "assetTicker" TYPE VARCHAR(20);
ALTER TABLE "Position" ALTER COLUMN "assetTicker" TYPE VARCHAR(20);
ALTER TABLE "Transaction" ALTER COLUMN "assetTicker" TYPE VARCHAR(20);
ALTER TABLE "WatchlistItem" ALTER COLUMN "assetTicker" TYPE VARCHAR(20);
ALTER TABLE "ComplianceAudit" ALTER COLUMN "assetTicker" TYPE VARCHAR(20);
