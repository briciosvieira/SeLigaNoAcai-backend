-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "amount_paid" DECIMAL(10,2),
ADD COLUMN     "payer_bank" VARCHAR(120),
ADD COLUMN     "payer_document" VARCHAR(20),
ADD COLUMN     "payer_name" VARCHAR(120),
ADD COLUMN     "provider_end_to_end_id" VARCHAR(80),
ADD COLUMN     "webhook_payload" JSONB;
