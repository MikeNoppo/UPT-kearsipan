/*
  Warnings:

  - A unique constraint covering the columns `[requestNumber]` on the table `purchase_requests` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `requestNumber` to the `purchase_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "purchase_requests" ADD COLUMN     "requestNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "receptions" ADD COLUMN     "purchaseRequestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requests_requestNumber_key" ON "purchase_requests"("requestNumber");

-- AddForeignKey
ALTER TABLE "receptions" ADD CONSTRAINT "receptions_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "purchase_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
