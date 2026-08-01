import { createRecordingQueue } from '@repo/queue';
import { getRedisConnection } from './redis.config.js';

let recordingQueue: ReturnType<typeof createRecordingQueue> | undefined;

/**
 * Returns the singleton recording-processing queue, creating it lazily on first use.
 * A single BullMQ Queue instance is designed to be shared across the app (jobs are
 * enqueued through the same instance), so it should never be instantiated per-request.
 *
 * Default job options:
 * - attempts: 3 retries before the job is marked failed
 * - backoff: exponential backoff starting at 5s between retries
 * - removeOnComplete/removeOnFail: cap the completed/failed job sets to keep Redis memory bounded
 */
export const getRecordingQueue = (): ReturnType<typeof createRecordingQueue> => {
    if (!recordingQueue) {
        recordingQueue = createRecordingQueue({
            connection: getRedisConnection(),
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: { count: 1000 },
                removeOnFail: { count: 5000 },
            },
        });
    }
    return recordingQueue;
};
