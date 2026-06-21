-- AlterEnum
ALTER TYPE "LoyaltyCardStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "loyalty_settings" ADD COLUMN     "validity_months" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "loyalty_cards" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "status" "LoyaltyCardStatus" NOT NULL DEFAULT 'ACTIVE',
    "stamps" INTEGER NOT NULL DEFAULT 0,
    "stamps_required" INTEGER NOT NULL DEFAULT 10,
    "min_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 16.00,
    "reward_description" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "redeemed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_announcements" (
    "id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loyalty_cards_customer_id_status_idx" ON "loyalty_cards"("customer_id", "status");

-- AddForeignKey
ALTER TABLE "loyalty_cards" ADD CONSTRAINT "loyalty_cards_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
