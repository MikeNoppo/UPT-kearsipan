/*
  Warnings:

  - You are about to drop the column `itemId` on the `purchase_requests` table. All the data in the column will be lost.
  - You are about to drop the column `itemName` on the `purchase_requests` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `purchase_requests` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `purchase_requests` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."purchase_requests" DROP CONSTRAINT "purchase_requests_itemId_fkey";

-- AlterTable
ALTER TABLE "public"."purchase_requests" DROP COLUMN "itemId",
DROP COLUMN "itemName",
DROP COLUMN "quantity",
DROP COLUMN "unit";
