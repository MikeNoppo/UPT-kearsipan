-- AlterTable
ALTER TABLE "public"."receptions" ALTER COLUMN "itemName" SET DEFAULT '',
ALTER COLUMN "requestedQuantity" SET DEFAULT 0,
ALTER COLUMN "receivedQuantity" SET DEFAULT 0,
ALTER COLUMN "unit" SET DEFAULT '';

-- CreateTable
CREATE TABLE "public"."reception_items" (
    "id" TEXT NOT NULL,
    "receptionId" TEXT NOT NULL,
    "purchaseRequestItemId" TEXT,
    "itemName" TEXT NOT NULL,
    "requestedQuantity" INTEGER NOT NULL,
    "receivedQuantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "itemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reception_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."reception_items" ADD CONSTRAINT "reception_items_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "public"."receptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reception_items" ADD CONSTRAINT "reception_items_purchaseRequestItemId_fkey" FOREIGN KEY ("purchaseRequestItemId") REFERENCES "public"."purchase_request_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reception_items" ADD CONSTRAINT "reception_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
