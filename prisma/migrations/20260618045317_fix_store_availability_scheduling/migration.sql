/*
  Warnings:

  - You are about to drop the column `availability_until` on the `stores` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "stores" DROP COLUMN "availability_until",
ADD COLUMN     "availability_change_at" TIMESTAMP(3),
ADD COLUMN     "scheduled_is_open" BOOLEAN;
