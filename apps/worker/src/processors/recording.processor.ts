import { Job } from 'bullmq';
import type { RecordingProcessingJob } from '@repo/queue';

export const processRecordingJob = async (job: Job<RecordingProcessingJob>) => {
    console.log('--------------------------------');
    console.log('Processing Recording');
    console.log('Job ID:', job.id);
    console.log('Recording ID:', job.data.recordingId);
    console.log('--------------------------------');
};
