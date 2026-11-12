-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PENGURUS', 'PETUGAS', 'MITRA');

-- CreateEnum
CREATE TYPE "WasteGroup" AS ENUM ('ANORGANIK', 'ORGANIK', 'RESIDU');

-- CreateEnum
CREATE TYPE "CollectionType" AS ENUM ('POINT_COLLECTION', 'HOME_PICKUP', 'DROP_OFF');

-- CreateEnum
CREATE TYPE "WeighingStatus" AS ENUM ('PENDING', 'USED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('COLLECTION', 'SALE', 'PROCESSING', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PickupStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "OrganicRecordType" AS ENUM ('FEEDING', 'OBSERVATION', 'HARVEST', 'FRASS');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "buyerId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "households" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "rt" TEXT,
    "rw" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_points" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waste_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "group" "WasteGroup" NOT NULL DEFAULT 'ANORGANIK',
    "listed" BOOLEAN NOT NULL DEFAULT false,
    "pricePerKg" DECIMAL(12,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waste_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_transactions" (
    "id" UUID NOT NULL,
    "collectionPointId" UUID NOT NULL,
    "householdId" UUID,
    "wasteCategoryId" UUID NOT NULL,
    "weightKg" DECIMAL(10,3) NOT NULL,
    "collectionType" "CollectionType" NOT NULL DEFAULT 'POINT_COLLECTION',
    "recordedById" UUID NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "clientMutationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weighing_records" (
    "id" UUID NOT NULL,
    "deviceId" TEXT NOT NULL,
    "weightKg" DECIMAL(10,3) NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "status" "WeighingStatus" NOT NULL DEFAULT 'PENDING',
    "collectionTransactionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weighing_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" UUID NOT NULL,
    "wasteCategoryId" UUID NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantityKg" DECIMAL(10,3) NOT NULL,
    "note" TEXT,
    "collectionTransactionId" UUID,
    "saleId" UUID,
    "plasticExperimentId" UUID,
    "recordedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_schedules" (
    "id" UUID NOT NULL,
    "collectionPointId" UUID NOT NULL,
    "assignedToId" UUID,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "PickupStatus" NOT NULL DEFAULT 'SCHEDULED',
    "movedWeightKg" DECIMAL(10,3),
    "handedOverTo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickup_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_requests" (
    "id" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "wasteCategoryId" UUID NOT NULL,
    "quantityKg" DECIMAL(10,3) NOT NULL,
    "offeredPricePerKg" DECIMAL(12,2),
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_transactions" (
    "id" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "wasteCategoryId" UUID NOT NULL,
    "weightKg" DECIMAL(10,3) NOT NULL,
    "pricePerKg" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "requestId" UUID,
    "soldAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organic_batches" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organic_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organic_records" (
    "id" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "type" "OrganicRecordType" NOT NULL,
    "weightKg" DECIMAL(10,3),
    "note" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organic_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plastic_experiments" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "wasteCategoryId" UUID NOT NULL,
    "plasticWeightKg" DECIMAL(10,3) NOT NULL,
    "composition" TEXT,
    "method" TEXT,
    "partner" TEXT,
    "prototypeCount" INTEGER NOT NULL DEFAULT 0,
    "testResult" TEXT,
    "evaluation" TEXT,
    "conductedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plastic_experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "collection_points_name_key" ON "collection_points"("name");

-- CreateIndex
CREATE UNIQUE INDEX "waste_categories_name_key" ON "waste_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "collection_transactions_clientMutationId_key" ON "collection_transactions"("clientMutationId");

-- CreateIndex
CREATE INDEX "collection_transactions_recordedAt_idx" ON "collection_transactions"("recordedAt");

-- CreateIndex
CREATE INDEX "collection_transactions_collectionPointId_recordedAt_idx" ON "collection_transactions"("collectionPointId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "weighing_records_collectionTransactionId_key" ON "weighing_records"("collectionTransactionId");

-- CreateIndex
CREATE INDEX "weighing_records_status_measuredAt_idx" ON "weighing_records"("status", "measuredAt");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_movements_collectionTransactionId_key" ON "inventory_movements"("collectionTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_movements_saleId_key" ON "inventory_movements"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_movements_plasticExperimentId_key" ON "inventory_movements"("plasticExperimentId");

-- CreateIndex
CREATE INDEX "inventory_movements_wasteCategoryId_idx" ON "inventory_movements"("wasteCategoryId");

-- CreateIndex
CREATE INDEX "inventory_movements_createdAt_idx" ON "inventory_movements"("createdAt");

-- CreateIndex
CREATE INDEX "pickup_schedules_scheduledAt_idx" ON "pickup_schedules"("scheduledAt");

-- CreateIndex
CREATE INDEX "marketplace_requests_status_idx" ON "marketplace_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sales_transactions_requestId_key" ON "sales_transactions"("requestId");

-- CreateIndex
CREATE INDEX "sales_transactions_soldAt_idx" ON "sales_transactions"("soldAt");

-- CreateIndex
CREATE UNIQUE INDEX "organic_batches_code_key" ON "organic_batches"("code");

-- CreateIndex
CREATE INDEX "organic_records_batchId_recordedAt_idx" ON "organic_records"("batchId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "plastic_experiments_code_key" ON "plastic_experiments"("code");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_transactions" ADD CONSTRAINT "collection_transactions_collectionPointId_fkey" FOREIGN KEY ("collectionPointId") REFERENCES "collection_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_transactions" ADD CONSTRAINT "collection_transactions_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_transactions" ADD CONSTRAINT "collection_transactions_wasteCategoryId_fkey" FOREIGN KEY ("wasteCategoryId") REFERENCES "waste_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_transactions" ADD CONSTRAINT "collection_transactions_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weighing_records" ADD CONSTRAINT "weighing_records_collectionTransactionId_fkey" FOREIGN KEY ("collectionTransactionId") REFERENCES "collection_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_wasteCategoryId_fkey" FOREIGN KEY ("wasteCategoryId") REFERENCES "waste_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_collectionTransactionId_fkey" FOREIGN KEY ("collectionTransactionId") REFERENCES "collection_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_plasticExperimentId_fkey" FOREIGN KEY ("plasticExperimentId") REFERENCES "plastic_experiments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_schedules" ADD CONSTRAINT "pickup_schedules_collectionPointId_fkey" FOREIGN KEY ("collectionPointId") REFERENCES "collection_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_schedules" ADD CONSTRAINT "pickup_schedules_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_requests" ADD CONSTRAINT "marketplace_requests_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_requests" ADD CONSTRAINT "marketplace_requests_wasteCategoryId_fkey" FOREIGN KEY ("wasteCategoryId") REFERENCES "waste_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_wasteCategoryId_fkey" FOREIGN KEY ("wasteCategoryId") REFERENCES "waste_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "marketplace_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organic_records" ADD CONSTRAINT "organic_records_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "organic_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plastic_experiments" ADD CONSTRAINT "plastic_experiments_wasteCategoryId_fkey" FOREIGN KEY ("wasteCategoryId") REFERENCES "waste_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

