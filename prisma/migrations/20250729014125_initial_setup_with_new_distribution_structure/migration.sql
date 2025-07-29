-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRATOR', 'STAFF');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReceptionStatus" AS ENUM ('COMPLETE', 'PARTIAL', 'DIFFERENT');

-- CreateEnum
CREATE TYPE "LetterType" AS ENUM ('INCOMING', 'OUTGOING');

-- CreateEnum
CREATE TYPE "LetterStatus" AS ENUM ('RECEIVED', 'SENT', 'DRAFT');

-- CreateEnum
CREATE TYPE "ArchiveStatus" AS ENUM ('UNDER_REVIEW', 'PERMANENT', 'SCHEDULED_DESTRUCTION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transactions" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_requests" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "itemId" TEXT,

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receptions" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "itemName" TEXT NOT NULL,
    "requestedQuantity" INTEGER NOT NULL,
    "receivedQuantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "status" "ReceptionStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "receivedById" TEXT NOT NULL,
    "itemId" TEXT,

    CONSTRAINT "receptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributions" (
    "id" TEXT NOT NULL,
    "noteNumber" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "distributionDate" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "distributedById" TEXT NOT NULL,

    CONSTRAINT "distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_items" (
    "id" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "distributionId" TEXT NOT NULL,
    "itemId" TEXT,

    CONSTRAINT "distribution_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letters" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "type" "LetterType" NOT NULL,
    "from" TEXT,
    "to" TEXT,
    "description" TEXT,
    "status" "LetterStatus" NOT NULL,
    "hasDocument" BOOLEAN NOT NULL DEFAULT false,
    "documentPath" TEXT,
    "documentName" TEXT,
    "documentSize" INTEGER,
    "documentType" TEXT,
    "uploadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archives" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL,
    "retentionPeriod" INTEGER NOT NULL,
    "status" "ArchiveStatus" NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "destructionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedById" TEXT NOT NULL,

    CONSTRAINT "archives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "distributions_noteNumber_key" ON "distributions"("noteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "letters_number_key" ON "letters"("number");

-- CreateIndex
CREATE UNIQUE INDEX "archives_code_key" ON "archives"("code");

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receptions" ADD CONSTRAINT "receptions_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receptions" ADD CONSTRAINT "receptions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributions" ADD CONSTRAINT "distributions_distributedById_fkey" FOREIGN KEY ("distributedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_items" ADD CONSTRAINT "distribution_items_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "distributions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_items" ADD CONSTRAINT "distribution_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters" ADD CONSTRAINT "letters_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archives" ADD CONSTRAINT "archives_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
