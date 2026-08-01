import type { RedisConnection } from '@repo/redis';
import type { QueueOptions } from 'bullmq';

export type QueueConfig = {
    connection: RedisConnection;
    /**
     * Default options applied to every job added to the queue.
     * See https://docs.bullmq.io/guide/jobs/job-options for the full list.
     */
    defaultJobOptions?: QueueOptions['defaultJobOptions'];
};
