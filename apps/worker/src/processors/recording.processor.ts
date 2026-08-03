import { Job } from 'bullmq';
import type { RecordingProcessingJob } from '@repo/queue';
import { getRecordingById } from '../services/recording.service.js';
import { downloadRecordingToTemp } from '../services/storage.service.js';

export const processRecordingJob = async (job: Job<RecordingProcessingJob>) => {
    console.log("Processing:", job.data.recordingId);

    const recording = await getRecordingById(job.data.recordingId);

    const localPath = await downloadRecordingToTemp(
        recording.id,
        recording.fileName,
        recording.fileKey,
    );

    console.log("Downloaded to:", localPath);
};
