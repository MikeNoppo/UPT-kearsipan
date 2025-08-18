/*
  Warnings:

  - Added the required column `itemName` to the `purchase_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `purchase_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `purchase_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."purchase_requests" ADD COLUMN     "itemId" TEXT,
ADD COLUMN     "itemName" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."purchase_requests" ADD CONSTRAINT "purchase_requests_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
