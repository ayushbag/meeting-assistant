import { prisma, type MeetingType } from '@repo/db';
import { logger } from '@repo/logger';

import { env } from '../config/app.config.js';
import type { MeetingClassification } from './intelligence/classifier.js';
import { extractIntelligence } from './intelligence/extractor.js';
import { verifyEvidence } from './intelligence/evidence.js';
import { mergeIntelligence } from './intelligence/merger.js';
import { persistIntelligence } from './intelligence/persist.js';
import {
    businessPrompt,
    businessPromptVersion,
} from './intelligence/prompts/business/v1.js';
import {
    genericPrompt,
    genericPromptVersion,
} from './intelligence/prompts/generic/v1.js';
import type { IntelligencePipeline } from './intelligence/router.js';
import type { CommonIntelligence } from './intelligence/schemas/common.js';
import { businessIntelligenceSchema } from './intelligence/schemas/business.js';
import { genericIntelligenceSchema } from './intelligence/schemas/generic.js';
import { segmentTranscript } from './intelligence/segmenter.js';
import {
    createIntelligenceStatus,
    failIntelligence,
    updateIntelligenceStatus,
} from './intelligence/status.js';
import { markCompleted, markFailed } from './meeting-status.service.js';
import { indexMeetingForRag } from './rag/indexing.service.js';
import { runSummaryPipeline } from './summary/pipeline.js';
import { isUsableTranscript } from './transcription.service.js';

const EMPTY_GENERIC_INTELLIGENCE: CommonIntelligence = {
    keyTopics: [],
    participants: [],
    importantMoments: [],
    openQuestions: [],
    outcomes: [],
    actionItems: [],
};

const forcedPipeline = (meetingType: MeetingType): IntelligencePipeline =>
    meetingType === 'BUSINESS'
        ? {
              meetingType: 'business',
              schema: businessIntelligenceSchema,
              prompt: businessPrompt,
              promptVersion: businessPromptVersion,
          }
        : {
              meetingType: 'other',
              schema: genericIntelligenceSchema,
              prompt: genericPrompt,
              promptVersion: genericPromptVersion,
          };

const normalizeLanguage = (
    language: string | null,
): MeetingClassification['language'] => {
    if (language === 'hi' || language === 'mr' || language === 'other') {
        return language;
    }

    return 'en';
};

/**
 * Rebuild intelligence, summary, and the RAG index from the stored transcript
 * after an owner overrides the meeting type. Dedicated pipelines remain
 * deferred, so only BUSINESS uses the business schema; every other type uses
 * the generic schema while the persisted meeting type keeps the override.
 */
export const rebuildMeetingType = async (
    meetingId: string,
    meetingType: MeetingType,
) => {
    const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        select: {
            transcript: { select: { content: true } },
            recording: { select: { id: true } },
            intelligence: {
                select: { goal: true, language: true, confidence: true },
            },
        },
    });

    if (!meeting) {
        throw new Error(`Meeting ${meetingId} not found`);
    }

    const transcript = meeting.transcript?.content;

    if (!transcript?.trim()) {
        throw new Error(
            `Meeting ${meetingId} has no stored transcript to rebuild from.`,
        );
    }

    const pipeline = forcedPipeline(meetingType);
    const classification: MeetingClassification = {
        meetingType: pipeline.meetingType,
        confidence: meeting.intelligence?.confidence ?? 1,
        goal: meeting.intelligence?.goal ?? 'Meeting type overridden by owner',
        language: normalizeLanguage(meeting.intelligence?.language ?? null),
    };

    try {
        await createIntelligenceStatus(meetingId);

        if (!isUsableTranscript(transcript)) {
            await persistIntelligence({
                meetingId,
                classification,
                resolvedMeetingType: pipeline.meetingType,
                intelligence: EMPTY_GENERIC_INTELLIGENCE,
                segmentCount: 0,
                promptVersion: genericPromptVersion,
                model: env.GEMINI_MODEL,
                forcedMeetingType: meetingType,
            });
        } else {
            await updateIntelligenceStatus(meetingId, 'EXTRACTING');

            const segments = segmentTranscript(transcript);
            const results = [];

            for (const segment of segments) {
                const result = await extractIntelligence(segment.text, pipeline);

                results.push({
                    segmentIndex: segment.index,
                    intelligence: verifyEvidence(result, [segment]),
                });
            }

            await updateIntelligenceStatus(meetingId, 'MERGING');

            const merged = await mergeIntelligence(results, pipeline);
            const verified = verifyEvidence(merged, segments);

            await persistIntelligence({
                meetingId,
                classification,
                resolvedMeetingType: pipeline.meetingType,
                intelligence: verified,
                segmentCount: segments.length,
                promptVersion: pipeline.promptVersion,
                model: env.GEMINI_MODEL,
                forcedMeetingType: meetingType,
            });
        }

        await runSummaryPipeline(transcript, meetingId);
        await indexMeetingForRag(meetingId);

        if (meeting.recording?.id) {
            await markCompleted(meeting.recording.id, meetingId);
        }

        logger.info(
            { meetingId, meetingType },
            'Meeting intelligence rebuilt from stored transcript',
        );

        return {
            meetingId,
            meetingType,
            rebuilt: true,
        };
    } catch (error) {
        await failIntelligence(meetingId, error);

        if (meeting.recording?.id) {
            await markFailed(meeting.recording.id, meetingId, error);
        }

        logger.error(
            { meetingId, meetingType, err: error },
            'Meeting type rebuild failed',
        );

        throw error;
    }
};
