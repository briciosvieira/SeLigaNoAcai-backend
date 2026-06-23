-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "last_pix_status_checked_at" TIMESTAMP(3),
ADD COLUMN     "next_pix_status_check_at" TIMESTAMP(3),
ADD COLUMN     "pix_status_check_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pix_status_check_finished" BOOLEAN NOT NULL DEFAULT false;
