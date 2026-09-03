-- P0-7 remainder: limit-order TTL so stale PENDING orders cannot accumulate.
-- New orders get expiresAt = createdAt + 7d (set in trading.service).
-- Existing PENDING rows are backfilled to createdAt + 7d; already-stale ones
-- expire on the next watcher tick (marked CANCELLED, not FAILED).
-- Applies on next Render `prisma migrate deploy`; no prod DB touched locally.

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

UPDATE "Order"
SET "expiresAt" = "createdAt" + INTERVAL '7 days'
WHERE "status" = 'PENDING' AND "expiresAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Order_status_expiresAt_idx" ON "Order"("status", "expiresAt");
