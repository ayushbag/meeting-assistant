/**
 * persist.ts
 * It takes the final verified intelligence:
 * and saves it to your database.
 */

import { prisma } from "@repo/db";
import { MeetingClassification } from "./classifier.js";
import { CommonIntelligence } from "./schemas/common.js";

type PersistIntelligenceInput = {
    meetingId: string;
    classification: MeetingClassification;
    intelligence: CommonIntelligence;
    segmentCount: number;
    promptVersion?: string;
    model?: string;
};

export const persistIntelligence = async (
    input: PersistIntelligenceInput,
) => {
    return prisma.meetingIntelligence.upsert({
        where: {
            meetingId: input.meetingId,
        },

        create: {
            meetingId: input.meetingId,
            meetingType: input.classification.meetingType.toUpperCase() as
                | 'LECTURE'
                | 'BUSINESS'
                | 'SALES'
                | 'INTERVIEW'
                | 'STANDUP'
                | 'BRAINSTORM'
                | 'REVIEW'
                | 'OTHER',

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
            meetingType: input.classification.meetingType.toUpperCase() as
                | 'LECTURE'
                | 'BUSINESS'
                | 'SALES'
                | 'INTERVIEW'
                | 'STANDUP'
                | 'BRAINSTORM'
                | 'REVIEW'
                | 'OTHER',

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
    });
};