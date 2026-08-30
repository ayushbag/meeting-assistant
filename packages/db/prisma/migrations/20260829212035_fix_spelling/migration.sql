/*
  Warnings:

  - You are about to drop the column `segementCount` on the `meeting_intelligence` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "meeting_intelligence" DROP COLUMN "segementCount",
ADD COLUMN     "segmentCount" INTEGER;
