-- CreateTable
CREATE TABLE "GeneratedMarketingImage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "prompt" TEXT NOT NULL,
    "finalPrompt" TEXT NOT NULL,
    "campaignType" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedMarketingImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedMarketingImage_userId_createdAt_idx" ON "GeneratedMarketingImage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GeneratedMarketingImage_campaignType_createdAt_idx" ON "GeneratedMarketingImage"("campaignType", "createdAt");

-- AddForeignKey
ALTER TABLE "GeneratedMarketingImage" ADD CONSTRAINT "GeneratedMarketingImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
