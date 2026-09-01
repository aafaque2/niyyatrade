-- CreateTable
CREATE TABLE "FxDailyRate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" DATE NOT NULL,
    "base" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "rates" JSONB NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FxDailyRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FxDailyRate_date_key" ON "FxDailyRate"("date");
CREATE INDEX "FxDailyRate_date_idx" ON "FxDailyRate"("date");