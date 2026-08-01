import { Queue } from 'bullmq';

import type { QueueConfig } from '../types.js';
import { QUEUE_NAMES } from '../queue-names.js';
import type { RecordingProcessingJob } from '../job-types.js';

export const createRecordingQueue = (config: QueueConfig) => {
    return new Queue<RecordingProcessingJob>(QUEUE_NAMES.RECORDING_PROCESSING, {
        connection: config.connection,
        defaultJobOptions: config.defaultJobOptions,
    });
};
