-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('BUY_X_GET_Y', 'PERCENTAGE_DISCOUNT');

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "PromotionType" NOT NULL,
    "buy_product_id" TEXT,
    "buy_quantity" INTEGER NOT NULL DEFAULT 1,
    "reward_product_id" TEXT,
    "reward_quantity" INTEGER,
    "discount_percent" DECIMAL(5,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promotions_type_idx" ON "promotions"("type");

-- CreateIndex
CREATE INDEX "promotions_is_active_idx" ON "promotions"("is_active");

-- CreateIndex
CREATE INDEX "promotions_buy_product_id_idx" ON "promotions"("buy_product_id");

-- CreateIndex
CREATE INDEX "promotions_reward_product_id_idx" ON "promotions"("reward_product_id");

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_buy_product_id_fkey" FOREIGN KEY ("buy_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_reward_product_id_fkey" FOREIGN KEY ("reward_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
