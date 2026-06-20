-- CreateEnum
CREATE TYPE "LoyaltyStampHistoryType" AS ENUM ('ORDER_EARNED', 'ADMIN_ADD', 'ADMIN_REMOVE', 'REWARD_GRANTED', 'REWARD_REDEEMED');

-- CreateTable
CREATE TABLE "loyalty_settings" (
    "id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT NOT NULL DEFAULT 'Cartão Fidelidade',
    "description" TEXT,
    "card_image_url" TEXT,
    "min_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 16.00,
    "stamps_required" INTEGER NOT NULL DEFAULT 10,
    "reward_description" TEXT NOT NULL DEFAULT 'Ganhe 1 açaí grátis',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_loyalties" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "stamps" INTEGER NOT NULL DEFAULT 0,
    "available_rewards" INTEGER NOT NULL DEFAULT 0,
    "total_earned_stamps" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_loyalties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_stamp_histories" (
    "id" TEXT NOT NULL,
    "customer_loyalty_id" TEXT NOT NULL,
    "order_id" TEXT,
    "type" "LoyaltyStampHistoryType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_stamp_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_loyalties_customer_id_key" ON "customer_loyalties"("customer_id");

-- CreateIndex
CREATE INDEX "loyalty_stamp_histories_customer_loyalty_id_idx" ON "loyalty_stamp_histories"("customer_loyalty_id");

-- CreateIndex
CREATE INDEX "loyalty_stamp_histories_order_id_idx" ON "loyalty_stamp_histories"("order_id");

-- AddForeignKey
ALTER TABLE "customer_loyalties" ADD CONSTRAINT "customer_loyalties_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_stamp_histories" ADD CONSTRAINT "loyalty_stamp_histories_customer_loyalty_id_fkey" FOREIGN KEY ("customer_loyalty_id") REFERENCES "customer_loyalties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_stamp_histories" ADD CONSTRAINT "loyalty_stamp_histories_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
