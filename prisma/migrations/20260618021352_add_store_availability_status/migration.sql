-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "availability_until" TIMESTAMP(3),
ADD COLUMN     "availability_updated_at" TIMESTAMP(3),
ADD COLUMN     "is_open" BOOLEAN NOT NULL DEFAULT false;
