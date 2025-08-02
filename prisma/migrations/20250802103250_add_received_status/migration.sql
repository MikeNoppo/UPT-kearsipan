/*
  Warnings:

  - You are about to drop the column `status` on the `archives` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'RECEIVED';

-- AlterTable
ALTER TABLE "archives" DROP COLUMN "status";

-- DropEnum
DROP TYPE "ArchiveStatus";
