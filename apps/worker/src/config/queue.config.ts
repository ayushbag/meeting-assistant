import { createAIProcessingQueue } from '@repo/queue';

import { getRedisConnection } from './redis.config.js';

let aiProcessingQueue: ReturnType<typeof createAIProcessingQueue> | undefined;

/**
 * Returns the singleton AI-processing queue, creating it lazily on first use.
 *
 * Used by the media processor to enqueue transcription jobs once the WAV is
 * safely stored. Kept separate from the API-side media-extraction queue.
 *
 * Default job options mirror the API queues: 3 retries with exponential
 * backoff starting at 5s, bounded completed/failed job sets.
 */
export const getAIProcessingQueue = (): ReturnType<typeof createAIProcessingQueue> => {
    if (!aiProcessingQueue) {
        aiProcessingQueue = createAIProcessingQueue({
            connection: getRedisConnection(),
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: { count: 1000 },
                removeOnFail: { count: 5000 },
            },
        });
    }
    return aiProcessingQueue;
};
