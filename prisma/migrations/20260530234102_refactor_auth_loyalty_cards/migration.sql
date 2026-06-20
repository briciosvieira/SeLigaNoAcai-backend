/*
  Warnings:

  - The values [REWARD_GRANTED] on the enum `LoyaltyTransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `reward_description` on the `loyalty_programs` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to drop the column `customer_loyalty_id` on the `loyalty_transactions` table. All the data in the column will be lost.
  - You are about to alter the column `description` on the `loyalty_transactions` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to drop the `customer_loyalty` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[order_id,transaction_type]` on the table `loyalty_transactions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `loyalty_card_id` to the `loyalty_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "LoyaltyCardStatus" AS ENUM ('ACTIVE', 'REWARD_AVAILABLE', 'REDEEMED', 'EXPIRED', 'CANCELED');

-- AlterEnum
BEGIN;
CREATE TYPE "LoyaltyTransactionType_new" AS ENUM ('STAMP_EARNED', 'REWARD_AVAILABLE', 'REWARD_REDEEMED', 'CARD_EXPIRED', 'ADJUSTMENT');
ALTER TABLE "loyalty_transactions" ALTER COLUMN "transaction_type" TYPE "LoyaltyTransactionType_new" USING ("transaction_type"::text::"LoyaltyTransactionType_new");
ALTER TYPE "LoyaltyTransactionType" RENAME TO "LoyaltyTransactionType_old";
ALTER TYPE "LoyaltyTransactionType_new" RENAME TO "LoyaltyTransactionType";
DROP TYPE "public"."LoyaltyTransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "customer_loyalty" DROP CONSTRAINT "customer_loyalty_customer_id_fkey";

-- DropForeignKey
ALTER TABLE "customer_loyalty" DROP CONSTRAINT "customer_loyalty_loyalty_program_id_fkey";

-- DropForeignKey
ALTER TABLE "loyalty_transactions" DROP CONSTRAINT "loyalty_transactions_customer_loyalty_id_fkey";

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "refresh_token_hash" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE "loyalty_programs" ADD COLUMN     "validity_months" INTEGER NOT NULL DEFAULT 10,
ALTER COLUMN "reward_description" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "loyalty_transactions" DROP COLUMN "customer_loyalty_id",
ADD COLUMN     "loyalty_card_id" TEXT NOT NULL,
ALTER COLUMN "description" SET DATA TYPE VARCHAR(255);

-- DropTable
DROP TABLE "customer_loyalty";

-- CreateTable
CREATE TABLE "customer_loyalty_cards" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "loyalty_program_id" TEXT NOT NULL,
    "card_number" INTEGER NOT NULL,
    "status" "LoyaltyCardStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_stamps" INTEGER NOT NULL DEFAULT 0,
    "required_stamps" INTEGER NOT NULL DEFAULT 10,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "redeemed_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "reward_description" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_loyalty_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_loyalty_cards_customer_id_status_idx" ON "customer_loyalty_cards"("customer_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "customer_loyalty_cards_customer_id_card_number_key" ON "customer_loyalty_cards"("customer_id", "card_number");

-- CreateIndex
CREATE INDEX "loyalty_transactions_loyalty_card_id_idx" ON "loyalty_transactions"("loyalty_card_id");

-- CreateIndex
CREATE INDEX "loyalty_transactions_order_id_idx" ON "loyalty_transactions"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_transactions_order_id_transaction_type_key" ON "loyalty_transactions"("order_id", "transaction_type");

-- AddForeignKey
ALTER TABLE "customer_loyalty_cards" ADD CONSTRAINT "customer_loyalty_cards_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_loyalty_cards" ADD CONSTRAINT "customer_loyalty_cards_loyalty_program_id_fkey" FOREIGN KEY ("loyalty_program_id") REFERENCES "loyalty_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_loyalty_card_id_fkey" FOREIGN KEY ("loyalty_card_id") REFERENCES "customer_loyalty_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
