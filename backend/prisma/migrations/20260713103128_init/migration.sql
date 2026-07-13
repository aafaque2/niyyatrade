-- CreateTable
CREATE TABLE "ComplianceAudit" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "assetTicker" VARCHAR(10) NOT NULL,
    "frameworkId" UUID NOT NULL,
    "verdict" VARCHAR(20) NOT NULL,
    "rules" JSONB NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplianceAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComplianceAudit_userId_evaluatedAt_idx" ON "ComplianceAudit"("userId", "evaluatedAt");

-- CreateIndex
CREATE INDEX "ComplianceAudit_userId_assetTicker_idx" ON "ComplianceAudit"("userId", "assetTicker");

-- CreateIndex
CREATE INDEX "Order_portfolioId_createdAt_idx" ON "Order"("portfolioId", "createdAt");

-- AddForeignKey
ALTER TABLE "ComplianceAudit" ADD CONSTRAINT "ComplianceAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceAudit" ADD CONSTRAINT "ComplianceAudit_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceAudit" ADD CONSTRAINT "ComplianceAudit_assetTicker_fkey" FOREIGN KEY ("assetTicker") REFERENCES "Asset"("ticker") ON DELETE RESTRICT ON UPDATE CASCADE;
