import { Queue } from 'bullmq';

import type { QueueConfig } from '../types.js';
import { QUEUE_NAMES } from '../queue-names.js';
import type { AIProcessingJob } from '../job-types.js';

export const createAIProcessingQueue = (config: QueueConfig) => {
    return new Queue<AIProcessingJob>(QUEUE_NAMES.AI_PROCESSING, {
        connection: config.connection,
        defaultJobOptions: config.defaultJobOptions,
    });
};
