-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('LECTURE', 'BUSINESS', 'SALES', 'INTERVIEW', 'STANDUP', 'BRAINSTORM', 'REVIEW', 'OTHER');

-- CreateEnum
CREATE TYPE "IntelligenceStatus" AS ENUM ('PENDING', 'CLASSIFYING', 'EXTRACTING', 'MERGING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "type" "MeetingType";

-- CreateTable
CREATE TABLE "meeting_intelligence" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "meetingType" "MeetingType" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "goal" TEXT,
    "language" TEXT,
    "status" "IntelligenceStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "promptVersion" TEXT,
    "model" TEXT,
    "segementCount" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_intelligence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meeting_intelligence_meetingId_key" ON "meeting_intelligence"("meetingId");

-- AddForeignKey
ALTER TABLE "meeting_intelligence" ADD CONSTRAINT "meeting_intelligence_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
