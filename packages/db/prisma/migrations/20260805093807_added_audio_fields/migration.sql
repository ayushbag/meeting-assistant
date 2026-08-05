-- AlterTable
ALTER TABLE "recordings" ADD COLUMN     "audioFileKey" TEXT,
ADD COLUMN     "audioFileName" TEXT,
ADD COLUMN     "audioMimeType" TEXT,
ADD COLUMN     "audioSize" BIGINT;
