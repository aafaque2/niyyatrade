-- P0-3: schema-level cascade deletes + missing indexes
-- Deleting a User now cascades to Portfolio, FrameworkOverrides, Watchlists,
-- ComplianceAudits, PasswordResetTokens (already cascaded). Deleting a Portfolio
-- cascades to Positions, Orders, Transactions (Transaction->Order also cascades so
-- portfolio delete does not hit FK ordering issues). Deleting a Watchlist cascades
-- to items. Asset FKs stay RESTRICT (reference data must not disappear while held).
-- User.activeFrameworkId stays SET NULL (already applied).

-- Drop existing RESTRICT FKs
ALTER TABLE "Portfolio" DROP CONSTRAINT "Portfolio_userId_fkey";
ALTER TABLE "Position" DROP CONSTRAINT "Position_portfolioId_fkey";
ALTER TABLE "Order" DROP CONSTRAINT "Order_portfolioId_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_portfolioId_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_orderId_fkey";
ALTER TABLE "FrameworkOverride" DROP CONSTRAINT "FrameworkOverride_userId_fkey";
ALTER TABLE "FrameworkOverride" DROP CONSTRAINT "FrameworkOverride_frameworkId_fkey";
ALTER TABLE "Watchlist" DROP CONSTRAINT "Watchlist_userId_fkey";
ALTER TABLE "WatchlistItem" DROP CONSTRAINT "WatchlistItem_watchlistId_fkey";
ALTER TABLE "ComplianceAudit" DROP CONSTRAINT "ComplianceAudit_userId_fkey";
ALTER TABLE "ComplianceAudit" DROP CONSTRAINT "ComplianceAudit_frameworkId_fkey";

-- Re-add with ON DELETE CASCADE
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Position" ADD CONSTRAINT "Position_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FrameworkOverride" ADD CONSTRAINT "FrameworkOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FrameworkOverride" ADD CONSTRAINT "FrameworkOverride_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComplianceAudit" ADD CONSTRAINT "ComplianceAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComplianceAudit" ADD CONSTRAINT "ComplianceAudit_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop redundant index (email already @unique -> User_email_key covers it)
DROP INDEX IF EXISTS "User_email_idx";

-- Missing indexes for watcher scans and ticker filters
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "Order_assetTicker_idx" ON "Order"("assetTicker");
CREATE INDEX IF NOT EXISTS "Transaction_assetTicker_idx" ON "Transaction"("assetTicker");
CREATE INDEX IF NOT EXISTS "FrameworkOverride_frameworkId_idx" ON "FrameworkOverride"("frameworkId");
CREATE INDEX IF NOT EXISTS "WatchlistItem_assetTicker_idx" ON "WatchlistItem"("assetTicker");
CREATE INDEX IF NOT EXISTS "ComplianceAudit_frameworkId_idx" ON "ComplianceAudit"("frameworkId");
