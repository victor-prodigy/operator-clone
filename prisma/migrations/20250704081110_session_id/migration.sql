/*
  Warnings:

  - You are about to drop the column `files` on the `Fragment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Fragment" DROP COLUMN "files",
ADD COLUMN     "sessionId" TEXT;
