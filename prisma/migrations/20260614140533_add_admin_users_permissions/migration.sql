-- CreateEnum
CREATE TYPE "AdminPermission" AS ENUM ('MANAGE_DASHBOARD', 'MANAGE_ORDERS', 'MANAGE_PRODUCTS', 'MANAGE_PAYMENTS', 'MANAGE_CUSTOMERS', 'MANAGE_LOYALTY', 'MANAGE_STORE', 'MANAGE_DELIVERY_ZONES', 'MANAGE_UPLOADS', 'MANAGE_USERS');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'STAFF';

-- CreateTable
CREATE TABLE "customer_admin_permissions" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "permission" "AdminPermission" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_admin_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_admin_permissions_customer_id_idx" ON "customer_admin_permissions"("customer_id");

-- CreateIndex
CREATE INDEX "customer_admin_permissions_permission_idx" ON "customer_admin_permissions"("permission");

-- CreateIndex
CREATE UNIQUE INDEX "customer_admin_permissions_customer_id_permission_key" ON "customer_admin_permissions"("customer_id", "permission");

-- AddForeignKey
ALTER TABLE "customer_admin_permissions" ADD CONSTRAINT "customer_admin_permissions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
