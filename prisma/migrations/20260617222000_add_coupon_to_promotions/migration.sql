-- AlterEnum
ALTER TYPE "PromotionType" ADD VALUE 'COUPON_PERCENTAGE_DISCOUNT';

-- AlterTable: adiciona coupon_code na tabela promotions
ALTER TABLE "promotions" ADD COLUMN "coupon_code" VARCHAR(40);

-- CreateIndex: unique para coupon_code
CREATE UNIQUE INDEX "promotions_coupon_code_key" ON "promotions"("coupon_code");

-- CreateIndex: index para buscas por cupom
CREATE INDEX "promotions_coupon_code_idx" ON "promotions"("coupon_code");

-- CreateTable: vínculo cupom ↔ produtos elegíveis
CREATE TABLE "promotion_eligible_products" (
    "id" TEXT NOT NULL,
    "promotion_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_eligible_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique por par (promoção, produto)
CREATE UNIQUE INDEX "promotion_eligible_products_promotion_id_product_id_key" ON "promotion_eligible_products"("promotion_id", "product_id");

-- CreateIndex
CREATE INDEX "promotion_eligible_products_promotion_id_idx" ON "promotion_eligible_products"("promotion_id");

-- CreateIndex
CREATE INDEX "promotion_eligible_products_product_id_idx" ON "promotion_eligible_products"("product_id");

-- AddForeignKey
ALTER TABLE "promotion_eligible_products" ADD CONSTRAINT "promotion_eligible_products_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_eligible_products" ADD CONSTRAINT "promotion_eligible_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
