-- CreateTable
CREATE TABLE "public"."reception_item_changes" (
    "id" TEXT NOT NULL,
    "receptionId" TEXT NOT NULL,
    "receptionItemId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" INTEGER NOT NULL,
    "newValue" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reception_item_changes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."reception_item_changes" ADD CONSTRAINT "reception_item_changes_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "public"."receptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reception_item_changes" ADD CONSTRAINT "reception_item_changes_receptionItemId_fkey" FOREIGN KEY ("receptionItemId") REFERENCES "public"."reception_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reception_item_changes" ADD CONSTRAINT "reception_item_changes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
