-- Typo-tolerant product search (available on Postgres hosts such as Neon, Supabase, RDS).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "guestTokenHash" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "searchAliases" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isGuest" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ServiceArea" (
    "id" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "SearchTerm" (
    "term" TEXT NOT NULL,
    "searches" INTEGER NOT NULL DEFAULT 0,
    "zeroResults" INTEGER NOT NULL DEFAULT 0,
    "lastResults" INTEGER NOT NULL DEFAULT 0,
    "lastSearchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchTerm_pkey" PRIMARY KEY ("term")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceArea_pincode_key" ON "ServiceArea"("pincode");

-- CreateIndex
CREATE INDEX "SearchTerm_zeroResults_idx" ON "SearchTerm"("zeroResults");

-- CreateIndex
CREATE INDEX "SearchTerm_searches_idx" ON "SearchTerm"("searches");

-- CreateIndex
CREATE UNIQUE INDEX "Order_guestTokenHash_key" ON "Order"("guestTokenHash");


-- Trigram index for fuzzy name matching.
CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx" ON "Product" USING GIN (lower("name") gin_trgm_ops);
