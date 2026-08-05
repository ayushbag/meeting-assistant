import { Job } from 'bullmq';
import type { RecordingProcessingJob } from '@repo/queue';
import { getRecordingById, updateRecording } from '../services/recording.service.js';
import { downloadRecordingToTemp } from '../services/storage.service.js';
import { cleanupTempFiles, getMediaMetadata } from '../services/media.service.js';
import {
    extractAudio,
    updateRecordingAudio,
    uploadExtractedAudio,
} from '../services/audio.service.js';

export const processRecordingJob = async (job: Job<RecordingProcessingJob>) => {
    console.log('Processing:', job.data.recordingId);

    const recording = await getRecordingById(job.data.recordingId);

    let localVideoPath = '';
    let wavPath = '';

    try {
        const localVideoPath = await downloadRecordingToTemp(
            recording.id,
            recording.fileName,
            recording.fileKey,
        );

        const metadata = await getMediaMetadata(localVideoPath);

        // update the duration and size in db
        await updateRecording(recording.id, metadata);

        // Extract Audio
        const wavPath = await extractAudio(localVideoPath);

        // Upload extracted audio
        const uploadedAudio = await uploadExtractedAudio(recording.meetingId, wavPath);

        // Persists uploaded audio information
        await updateRecordingAudio(recording.id, uploadedAudio);
    } finally {
        // cleanup temp files
        await cleanupTempFiles(localVideoPath, wavPath);
    }
};
