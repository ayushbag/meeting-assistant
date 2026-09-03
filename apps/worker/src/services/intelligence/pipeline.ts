import { logger } from '@repo/logger';
import { classifyMeeting } from './classifier.js';
import { verifyEvidence } from './evidence.js';
import { extractIntelligence } from './extractor.js';
import { mergeIntelligence } from './merger.js';
import { persistIntelligence } from './persist.js';
import { routeMeeting } from './router.js';
import { segmentTranscript } from './segmenter.js';
import { createIntelligenceStatus, failIntelligence, updateIntelligenceStatus } from './status.js';

export const runIntelligencePipeline = async (transcript: string, meetingId: string) => {
    await createIntelligenceStatus(meetingId);

    try {
        // classify the meeting
        await updateIntelligenceStatus(meetingId, 'CLASSIFYING');

        const classification = await classifyMeeting(transcript);

        logger.info({ meetingId }, 'Meeting classified');

        // route to the correct intelligence pipeline
        const pipeline = routeMeeting(classification);

        logger.info(
            { meetingId, meetingType: classification.meetingType },
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

            results.push({
                segmentIndex: segment.index,
                intelligence: result,
            });
        }

        logger.info({ meetingId, segmentCount: segments.length }, 'Intelligence extracted');

        // merge segment intelligence
        await updateIntelligenceStatus(meetingId, 'MERGING');

        const intelligence = await mergeIntelligence(results, pipeline);

        logger.info({ meetingId }, 'Intelligence merged');

        // Verify evidence
        verifyEvidence(intelligence, segments);

        logger.info({ meetingId }, 'Evidence verified');

        // persist final intelligence
        await persistIntelligence({
            meetingId,
            classification,
            intelligence,
            segmentCount: segments.length,
        });

        logger.info({ meetingId }, 'Intelligence persisted');

        return {
            classification,
            intelligence,
        };
    } catch (error) {
        await failIntelligence(meetingId, error);

        logger.error({ meetingId, err: error }, 'Intelligence pipeline failed');

        throw error;
    }
};
