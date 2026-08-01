import { Worker } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES, type RecordingProcessingJob } from '@repo/queue';

import { getRedisConnection } from './redis.config.js';
import { processRecordingJob } from '../processors/recording.processor.js';

let recordingWorker: Worker<RecordingProcessingJob> | undefined;

/**
 * Returns the singleton BullMQ worker responsible for processing
 * uploaded meeting recordings.
 */
export const getRecordingWorker = (): Worker<RecordingProcessingJob> => {
    if (!recordingWorker) {
        recordingWorker = new Worker<RecordingProcessingJob>(
            QUEUE_NAMES.RECORDING_PROCESSING,
            async (job) => {
                switch (job.name) {
                    case JOB_NAMES.PROCESS_RECORDING:
                        await processRecordingJob(job);
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

    return recordingWorker;
};
