-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aiBonusTokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "dailyFreeUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "dailyFreeResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "dailyAdRewardsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "dailyAdResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE IF NOT EXISTS "token_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "action" TEXT,
    "externalTxId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "token_transactions_externalTxId_key" ON "token_transactions"("externalTxId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "token_transactions_userId_createdAt_idx" ON "token_transactions"("userId", "createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'token_transactions_userId_fkey'
    ) THEN
        ALTER TABLE "token_transactions"
        ADD CONSTRAINT "token_transactions_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
