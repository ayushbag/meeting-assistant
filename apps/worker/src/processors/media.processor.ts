import { Job } from 'bullmq';
import { JOB_NAMES, type AIProcessingJob, type MediaExtractionJob } from '@repo/queue';
import { logger } from '@repo/logger';
import { deleteRecording } from '@repo/storage';

import { env } from '../config/app.config.js';
import { getStorageClient } from '../config/storage.config.js';
import { getAIProcessingQueue } from '../config/queue.config.js';
import { getRecordingById, updateRecording } from '../services/recording.service.js';
import { downloadToTemp } from '../services/storage.service.js';
import { cleanupTempFiles, getMediaMetadata } from '../services/media.service.js';
import {
    extractAudio,
    updateRecordingAudio,
    uploadExtractedAudio,
} from '../services/audio.service.js';

/**
 * Phase 1 media-extraction job (low concurrency — this is the CPU-bound step):
 *
 *   download source → ffprobe → ffmpeg (16kHz mono WAV, thread-capped, with a
 *   stream-copy short-circuit) → upload WAV → persist audio metadata →
 *   enqueue AI job → delete the source video (transient asset, D2).
 *
 * The same processor body can run as a Lambda at scale — see
 * learning/architecture-decisions.md §7 (deploy-day swap, no rewrite).
 */
export const processMediaExtractionJob = async (job: Job<MediaExtractionJob>) => {
    logger.info({ recordingId: job.data.recordingId }, 'Extracting audio...');

    const recording = await getRecordingById(job.data.recordingId);

    let localPath = '';
    let wavPath = '';

    try {
        localPath = await downloadToTemp(recording.id, recording.fileName, recording.fileKey);

        const metadata = await getMediaMetadata(localPath);

        // Update duration and size in DB
        await updateRecording(recording.id, metadata);

        if (!metadata.audio) {
            throw new Error('No audio stream found in recording; cannot extract audio.');
        }

        // Short-circuit: if the source audio is already 16kHz mono PCM, stream-copy
        // it into the WAV container instead of decoding/resampling — near-zero CPU.
        const canStreamCopy =
            metadata.audio.codec === 'pcm_s16le' &&
            metadata.audio.sampleRate === 16000 &&
            metadata.audio.channels === 1;

        wavPath = await extractAudio(localPath, { streamCopy: canStreamCopy });

        // Upload extracted audio
        const uploadedAudio = await uploadExtractedAudio(recording.meetingId, wavPath);

        // Persist uploaded audio information
        await updateRecordingAudio(recording.id, uploadedAudio);

        // Enqueue the AI job BEFORE deleting the source video: if enqueueing fails,
        // the job retries and can still re-extract from the video. jobId dedupes —
        // a retry never enqueues a second AI job.
        const aiQueue = getAIProcessingQueue();
        const existing = await aiQueue.getJob(recording.id);
        if (!existing) {
            await aiQueue.add(
                JOB_NAMES.PROCESS_AI,
                { recordingId: recording.id } satisfies AIProcessingJob,
                { jobId: recording.id },
            );
        }

        // The video is transient (D2): delete the source now that the WAV is safely
        // stored and the AI job is queued. Best-effort — cleanup failure must never
        // fail the job (an S3 lifecycle rule on recordings/ is the backstop).
        //
        // Known accepted window: if the process dies AFTER this delete but BEFORE
        // the job is marked complete, the retry fails with "File not found". That
        // is data-safe (the AI job is already queued and the WAV is stored) —
        // just failed-job noise; do not "fix" it by adding retries here.
        try {
            await deleteRecording({
                client: getStorageClient(),
                bucket: env.S3_BUCKET_NAME,
                fileKey: recording.fileKey,
            });
            logger.info({ recordingId: recording.id }, 'Source recording deleted from storage');
        } catch (error) {
            logger.error(
                { err: error, recordingId: recording.id },
                'Failed to delete source recording',
            );
        }
    } finally {
        // Cleanup temp files
        await cleanupTempFiles(localPath, wavPath);
    }
};
