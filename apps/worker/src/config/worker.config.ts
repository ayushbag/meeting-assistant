import { Worker } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES, type AIProcessingJob, type MediaExtractionJob } from '@repo/queue';

import { getRedisConnection } from './redis.config.js';
import { processMediaExtractionJob } from '../processors/media.processor.js';
import { processAIJob } from '../processors/ai.processor.js';

let mediaExtractionWorker: Worker<MediaExtractionJob> | undefined;
let aiWorker: Worker<AIProcessingJob> | undefined;

/**
 * Returns the singleton BullMQ worker for the media-extraction queue.
 *
 * This is the CPU-bound step (ffmpeg). Concurrency stays at 1–2 and each
 * ffmpeg run is thread-capped, so a burst of extractions can never saturate
 * the box or starve the AI queue (learning/architecture-decisions.md D4/D8).
 */
export const getMediaExtractionWorker = (): Worker<MediaExtractionJob> => {
    if (!mediaExtractionWorker) {
        mediaExtractionWorker = new Worker<MediaExtractionJob>(
            QUEUE_NAMES.MEDIA_EXTRACTION,
            async (job) => {
                switch (job.name) {
                    case JOB_NAMES.EXTRACT_AUDIO:
                        await processMediaExtractionJob(job);
                        break;

                    default:
                        throw new Error(`Unknown Job: ${job.name}`);
                }
            },
            {
                connection: getRedisConnection(),
                concurrency: 2,
            },
        );
    }

    return mediaExtractionWorker;
};

/**
 * Returns the singleton BullMQ worker for the AI-processing queue.
 *
 * Pure network-bound work (Gemini transcription + intelligence), so it runs at
 * high concurrency — the CPU is idle while waiting on API calls.
 */
export const getAIWorker = (): Worker<AIProcessingJob> => {
    if (!aiWorker) {
        aiWorker = new Worker<AIProcessingJob>(
            QUEUE_NAMES.AI_PROCESSING,
            async (job) => {
                switch (job.name) {
                    case JOB_NAMES.PROCESS_AI:
                        await processAIJob(job);
                        break;

                    default:
                        throw new Error(`Unknown Job: ${job.name}`);
                }
            },
            {
                connection: getRedisConnection(),
                concurrency: 5,
            },
        );
    }

    return aiWorker;
};
