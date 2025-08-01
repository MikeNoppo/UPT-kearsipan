/*
  Warnings:

  - You are about to drop the column `status` on the `letters` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "letters" DROP COLUMN "status";

-- DropEnum
DROP TYPE "LetterStatus";
