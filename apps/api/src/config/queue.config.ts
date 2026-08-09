import { createMediaExtractionQueue } from '@repo/queue';
import { getRedisConnection } from './redis.config.js';

let mediaExtractionQueue: ReturnType<typeof createMediaExtractionQueue> | undefined;

/**
 * Returns the singleton media-extraction queue, creating it lazily on first use.
 * A single BullMQ Queue instance is designed to be shared across the app (jobs are
 * enqueued through the same instance), so it should never be instantiated per-request.
 *
 * Upload completion enqueues EXTRACT_AUDIO here; the worker extracts the 16kHz mono
 * WAV and then enqueues the AI job to the ai-processing queue.
 *
 * Default job options:
 * - attempts: 3 retries before the job is marked failed
 * - backoff: exponential backoff starting at 5s between retries
 * - removeOnComplete/removeOnFail: cap the completed/failed job sets to keep Redis memory bounded
 */
export const getMediaExtractionQueue = (): ReturnType<typeof createMediaExtractionQueue> => {
    if (!mediaExtractionQueue) {
        mediaExtractionQueue = createMediaExtractionQueue({
            connection: getRedisConnection(),
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: { count: 1000 },
                removeOnFail: { count: 5000 },
            },
        });
    }
    return mediaExtractionQueue;
};
