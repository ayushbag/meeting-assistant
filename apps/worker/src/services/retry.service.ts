import { randomUUID } from 'node:crypto';

import { prisma, type MeetingIntelligence } from '@repo/db';
import { logger } from '@repo/logger';
import { chunkTranscript, qdrantClient, qdrantConfig } from '@repo/rag';
import {
    AI_STAGES,
    createMediaExtractionQueue,
    JOB_NAMES,
    type AIProcessingJob,
    type AIStage,
    type MediaExtractionJob,
} from '@repo/queue';
import { headRecording } from '@repo/storage';

import { env } from '../config/app.config.js';
import { getAIProcessingQueue } from '../config/queue.config.js';
import { getRedisConnection } from '../config/redis.config.js';
import { getStorageClient } from '../config/storage.config.js';
import { markCompleted, markFailed, markSummarizing } from './meeting-status.service.js';
import {
    buildRagDocuments,
    type MeetingIntelligencePayload,
} from './rag/document-builder.js';
import { indexMeetingForRag } from './rag/indexing.service.js';
import { runSummaryPipeline } from './summary/pipeline.js';

export const RETRY_ACTIONS = {
    REUPLOAD_REQUIRED: 'REUPLOAD_REQUIRED',
    EXTRACT_AUDIO: JOB_NAMES.EXTRACT_AUDIO,
    PROCESS_AI: JOB_NAMES.PROCESS_AI,
    REGENERATE_SUMMARY: 'REGENERATE_SUMMARY',
    INDEX_REQUIRED: 'INDEX_REQUIRED',
    NO_ACTION: 'NO_ACTION',
} as const;

export type RetryAction = (typeof RETRY_ACTIONS)[keyof typeof RETRY_ACTIONS];

export interface RetryDecision {
    action: RetryAction;
    recordingId?: string;
    fromStage?: AIStage;
    reason: string;
    jobId?: string;
}

const objectExists = async (fileKey?: string | null): Promise<boolean> => {
    if (!fileKey) return false;

    const result = await headRecording({
        client: getStorageClient(),
        bucket: env.S3_BUCKET_NAME,
        fileKey,
    });

    return result.exists;
};

type IndexCheck =
    | { current: true; expected: number; found: number }
    | { current: false; reason: string };

const checkIndex = async (
    meetingId: string,
    transcript: string,
    intelligence: MeetingIntelligence,
): Promise<IndexCheck> => {
    const expected =
        buildRagDocuments(meetingId, {
            classification: { goal: intelligence.goal ?? undefined },
            intelligence:
                intelligence.payload as MeetingIntelligencePayload['intelligence'],
        }).length + chunkTranscript(meetingId, transcript).length;

    try {
        const result = await qdrantClient.count(qdrantConfig.collection, {
            filter: {
                must: [
                    {
                        key: 'meetingId',
                        match: { value: meetingId },
                    },
                ],
            },
            exact: true,
        });

        if (result.count === expected) {
            return { current: true, expected, found: result.count };
        }

        return {
            current: false,
            reason: `RAG index is stale; expected ${expected} points but found ${result.count}.`,
        };
    } catch (error) {
        logger.warn(
            { err: error, meetingId },
            'Could not inspect the RAG index',
        );

        return {
            current: false,
            reason: 'RAG index is unavailable and must be rebuilt.',
        };
    }
};

/**
 * Decide the earliest stage that must run again based on persisted artifacts.
 * The source object is only required when the WAV is absent: successful media
 * extraction deliberately deletes it as a transient asset.
 */
export const decideRetry = async (meetingId: string): Promise<RetryDecision> => {
    const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
            recording: true,
            transcript: true,
            intelligence: true,
            summary: true,
        },
    });

    if (!meeting) {
        throw new Error(`Meeting ${meetingId} not found`);
    }

    const recording = meeting.recording;

    if (!recording) {
        return {
            action: RETRY_ACTIONS.REUPLOAD_REQUIRED,
            reason: 'No recording exists for this meeting.',
        };
    }

    const hasAudio = await objectExists(recording.audioFileKey);

    if (!hasAudio) {
        const hasSource = await objectExists(recording.fileKey);

        if (!hasSource) {
            return {
                action: RETRY_ACTIONS.REUPLOAD_REQUIRED,
                recordingId: recording.id,
                reason: 'Source recording is missing from storage.',
            };
        }

        return {
            action: RETRY_ACTIONS.EXTRACT_AUDIO,
            recordingId: recording.id,
            reason: 'Extracted audio is missing; source recording is still available.',
        };
    }

    const transcript = meeting.transcript?.content?.trim();

    if (!transcript) {
        return {
            action: RETRY_ACTIONS.PROCESS_AI,
            recordingId: recording.id,
            fromStage: AI_STAGES.TRANSCRIPTION,
            reason: 'Valid transcript is missing; extracted audio can be reused.',
        };
    }

    const intelligence = meeting.intelligence;
    const intelligenceReady = intelligence?.status === 'READY' && intelligence.payload != null;

    if (!intelligenceReady) {
        return {
            action: RETRY_ACTIONS.PROCESS_AI,
            recordingId: recording.id,
            fromStage: AI_STAGES.INTELLIGENCE,
            reason: 'Intelligence is missing or failed; stored transcript can be reused.',
        };
    }

    if (!meeting.summary?.markdown?.trim()) {
        return {
            action: RETRY_ACTIONS.REGENERATE_SUMMARY,
            recordingId: recording.id,
            reason: 'Summary is missing; it can be regenerated from the stored transcript.',
        };
    }

    const indexCheck = await checkIndex(
        meetingId,
        transcript,
        intelligence!,
    );

    if (!indexCheck.current) {
        return {
            action: RETRY_ACTIONS.INDEX_REQUIRED,
            recordingId: recording.id,
            reason: indexCheck.reason,
        };
    }

    return {
        action: RETRY_ACTIONS.NO_ACTION,
        recordingId: recording.id,
        reason: 'All processing artifacts are present and indexed.',
    };
};

const enqueueExtraction = async (recordingId: string): Promise<string | undefined> => {
    const attemptId = randomUUID();
    const queue = createMediaExtractionQueue({
        connection: getRedisConnection(),
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: { count: 1000 },
            removeOnFail: { count: 5000 },
        },
    });

    const job = await queue.add(
        JOB_NAMES.EXTRACT_AUDIO,
        { recordingId, attemptId } satisfies MediaExtractionJob,
        { jobId: `${recordingId}-extract-${attemptId}` },
    );

    await queue.close();

    return job.id;
};

const enqueueAI = async (
    recordingId: string,
    fromStage: AIStage | undefined,
): Promise<string | undefined> => {
    const attemptId = randomUUID();

    const job = await getAIProcessingQueue().add(
        JOB_NAMES.PROCESS_AI,
        { recordingId, attemptId, fromStage } satisfies AIProcessingJob,
        { jobId: `${recordingId}-ai-${attemptId}` },
    );

    return job.id;
};

const regenerateSummary = async (meetingId: string, recordingId: string) => {
    try {
        await markSummarizing(recordingId, meetingId);

        const transcript = await prisma.transcript.findUnique({
            where: { meetingId },
            select: { content: true },
        });

        if (!transcript?.content?.trim()) {
            throw new Error('Stored transcript is missing or empty; cannot regenerate summary.');
        }

        await runSummaryPipeline(transcript.content, meetingId);
        await markCompleted(recordingId, meetingId);

        logger.info({ meetingId }, 'Summary regenerated from stored transcript');
    } catch (error) {
        await markFailed(recordingId, meetingId, error);
        throw error;
    }
};

const reindexMeeting = async (meetingId: string, recordingId: string) => {
    try {
        await indexMeetingForRag(meetingId);
        await markCompleted(recordingId, meetingId);

        logger.info({ meetingId }, 'RAG index rebuilt from stored artifacts');
    } catch (error) {
        await markFailed(recordingId, meetingId, error);
        throw error;
    }
};

/** Apply the earliest-safe retry stage and return what was enqueued or repaired. */
export const retryMeetingProcessing = async (meetingId: string): Promise<RetryDecision> => {
    const decision = await decideRetry(meetingId);

    logger.info(
        {
            meetingId,
            action: decision.action,
            fromStage: decision.fromStage,
            reason: decision.reason,
        },
        'Retry decision made',
    );

    switch (decision.action) {
        case RETRY_ACTIONS.EXTRACT_AUDIO: {
            const jobId = await enqueueExtraction(decision.recordingId!);
            return { ...decision, jobId };
        }
        case RETRY_ACTIONS.PROCESS_AI: {
            const jobId = await enqueueAI(decision.recordingId!, decision.fromStage);
            return { ...decision, jobId };
        }
        case RETRY_ACTIONS.REGENERATE_SUMMARY: {
            await regenerateSummary(meetingId, decision.recordingId!);
            return decision;
        }
        case RETRY_ACTIONS.INDEX_REQUIRED: {
            await reindexMeeting(meetingId, decision.recordingId!);
            return decision;
        }
        case RETRY_ACTIONS.NO_ACTION: {
            await markCompleted(decision.recordingId!, meetingId);
            return decision;
        }
        default:
            return decision;
    }
};
