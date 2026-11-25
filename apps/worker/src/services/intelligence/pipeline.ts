import { logger } from '@repo/logger';
import { env } from '../../config/app.config.js';
import { isUsableTranscript } from '../transcription.service.js';
import { classifyMeeting, type MeetingClassification } from './classifier.js';
import { verifyEvidence } from './evidence.js';
import { extractIntelligence } from './extractor.js';
import { mergeIntelligence } from './merger.js';
import { genericPromptVersion } from './prompts/generic/v1.js';
import { persistIntelligence } from './persist.js';
import { routeMeeting } from './router.js';
import { segmentTranscript } from './segmenter.js';
import { createIntelligenceStatus, failIntelligence, updateIntelligenceStatus } from './status.js';
import type { CommonIntelligence } from './schemas/common.js';

const EMPTY_GENERIC_CLASSIFICATION: MeetingClassification = {
    meetingType: 'other',
    confidence: 0,
    goal: 'No spoken content detected',
    language: 'en',
};

const EMPTY_GENERIC_INTELLIGENCE: CommonIntelligence = {
    keyTopics: [],
    participants: [],
    importantMoments: [],
    openQuestions: [],
    outcomes: [],
    actionItems: [],
};

export const runIntelligencePipeline = async (transcript: string, meetingId: string) => {
    try {
        await createIntelligenceStatus(meetingId);

        if (!isUsableTranscript(transcript)) {
            const length = transcript.trim().length;
            const reason = `Transcript length ${length} is below minimum ${env.MIN_TRANSCRIPT_CHARS}`;

            logger.info({ meetingId, length, reason }, 'Skipping intelligence extraction for empty/short transcript');

            await persistIntelligence({
                meetingId,
                classification: EMPTY_GENERIC_CLASSIFICATION,
                resolvedMeetingType: 'other',
                intelligence: EMPTY_GENERIC_INTELLIGENCE,
                segmentCount: 0,
                promptVersion: genericPromptVersion,
                model: env.GEMINI_MODEL,
            });

            return {
                classification: EMPTY_GENERIC_CLASSIFICATION,
                intelligence: EMPTY_GENERIC_INTELLIGENCE,
                skipped: true,
                reason,
            };
        }

        // classify the meeting
        await updateIntelligenceStatus(meetingId, 'CLASSIFYING');

        const classification = await classifyMeeting(transcript);

        logger.info({ meetingId }, 'Meeting classified');

        // route to the correct intelligence pipeline
        const pipeline = routeMeeting(classification);

        logger.info(
            {
                meetingId,
                classifiedAs: classification.meetingType,
                routedTo: pipeline.meetingType,
            },
            'Intelligence pipeline routed',
        );

        // segment the transcript
        await updateIntelligenceStatus(meetingId, 'EXTRACTING');

        const segments = segmentTranscript(transcript);

        logger.info({ meetingId, segmentCount: segments.length }, 'Transcript segmented');

        // extract intelligence from each segement
        const results = [];

        for (const segment of segments) {
            const result = await extractIntelligence(segment.text, pipeline);
            const verifiedResult = verifyEvidence(result, [segment]);

            results.push({
                segmentIndex: segment.index,
                intelligence: verifiedResult,
            });
        }

        logger.info({ meetingId, segmentCount: segments.length }, 'Intelligence extracted');

        // merge segment intelligence
        await updateIntelligenceStatus(meetingId, 'MERGING');

        const intelligence = await mergeIntelligence(results, pipeline);

        logger.info({ meetingId }, 'Intelligence merged');

        // Verify evidence
        const verifiedIntelligence = verifyEvidence(intelligence, segments);

        logger.info({ meetingId }, 'Evidence verified');

        // persist final intelligence
        await persistIntelligence({
            meetingId,
            classification,
            resolvedMeetingType: pipeline.meetingType,
            intelligence: verifiedIntelligence,
            segmentCount: segments.length,
            promptVersion: pipeline.promptVersion,
            model: env.GEMINI_MODEL,
        });

        logger.info({ meetingId }, 'Intelligence persisted');

        return {
            classification,
            intelligence: verifiedIntelligence,
        };
    } catch (error) {
        await failIntelligence(meetingId, error);

        logger.error({ meetingId, err: error }, 'Intelligence pipeline failed');

        throw error;
    }
};
