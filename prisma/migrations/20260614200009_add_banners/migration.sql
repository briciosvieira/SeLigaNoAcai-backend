-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "mobile_image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banners_is_active_idx" ON "banners"("is_active");

-- CreateIndex
CREATE INDEX "banners_sort_order_idx" ON "banners"("sort_order");
