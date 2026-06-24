-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "password_recovery_settings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "subject_template" VARCHAR(255),
    "body_template" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_recovery_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_recovery_attempts" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_recovery_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "password_recovery_attempts_email_created_at_idx" ON "password_recovery_attempts"("email", "created_at");
