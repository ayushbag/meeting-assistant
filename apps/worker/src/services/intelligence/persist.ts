/**
 * persist.ts
 * It takes the final verified intelligence:
 * and saves it to your database.
 */

import { prisma, type MeetingType } from "@repo/db";
import { MeetingClassification } from "./classifier.js";
import { CommonIntelligence } from "./schemas/common.js";

type PersistIntelligenceInput = {
    meetingId: string;
    classification: MeetingClassification;
    resolvedMeetingType: 'business' | 'other';
    intelligence: CommonIntelligence;
    segmentCount: number;
    promptVersion?: string;
    model?: string;
    forcedMeetingType?: MeetingType;
};

export const persistIntelligence = async (
    input: PersistIntelligenceInput,
) => {
    const meetingType =
        input.forcedMeetingType ??
        (input.resolvedMeetingType.toUpperCase() as 'BUSINESS' | 'OTHER');

    return prisma.$transaction([
        prisma.meeting.update({
            where: { id: input.meetingId },
            data: { type: meetingType },
        }),
        prisma.meetingIntelligence.upsert({
            where: { meetingId: input.meetingId },
            create: {
                meetingId: input.meetingId,
                meetingType,
                confidence: input.classification.confidence,
                goal: input.classification.goal,
                language: input.classification.language,
                status: 'READY',
                payload: input.intelligence,
                promptVersion: input.promptVersion,
                model: input.model,
                segmentCount: input.segmentCount,
            },
            update: {
                meetingType,
                confidence: input.classification.confidence,
                goal: input.classification.goal,
                language: input.classification.language,
                status: 'READY',
                payload: input.intelligence,
                promptVersion: input.promptVersion,
                model: input.model,
                segmentCount: input.segmentCount,
                error: null,
            },
        }),
    ]);
};
