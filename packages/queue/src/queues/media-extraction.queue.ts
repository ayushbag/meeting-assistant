import { Queue } from 'bullmq';

import type { QueueConfig } from '../types.js';
import { QUEUE_NAMES } from '../queue-names.js';
import type { MediaExtractionJob } from '../job-types.js';

export const createMediaExtractionQueue = (config: QueueConfig) => {
    return new Queue<MediaExtractionJob>(QUEUE_NAMES.MEDIA_EXTRACTION, {
        connection: config.connection,
        defaultJobOptions: config.defaultJobOptions,
    });
};
