ALTER TABLE "CreatedCV" ADD COLUMN "shareToken" TEXT;
ALTER TABLE "CreatedCV" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX "CreatedCV_shareToken_key" ON "CreatedCV"("shareToken");
CREATE INDEX "CreatedCV_shareToken_idx" ON "CreatedCV"("shareToken");
