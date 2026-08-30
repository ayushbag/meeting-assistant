import { Job } from 'bullmq';
import type { AIProcessingJob } from '@repo/queue';
import { logger } from '@repo/logger';

import { getRecordingById } from '../services/recording.service.js';
import { downloadToTemp } from '../services/storage.service.js';
import { cleanupTempFiles } from '../services/media.service.js';
import { createTranscript, transcribeAudio } from '../services/transcription.service.js';
import { runIntelligencePipeline } from '../services/intelligence/pipeline.js';

/**
 * Phase 1 AI-processing job (high concurrency — this step is network-bound):
 *
 *   download extracted WAV → Gemini transcription → persist transcript.
 *
 * Runs on the same box as the media worker but on its own queue, so ffmpeg
 * bursts can never starve it (learning/architecture-decisions.md §6/§7).
 */
export const processAIJob = async (job: Job<AIProcessingJob>) => {
    logger.info({ recordingId: job.data.recordingId }, 'Transcribing audio...');

    const recording = await getRecordingById(job.data.recordingId);

    if (!recording.audioFileKey) {
        throw new Error('Recording has no extracted audio; media-extraction job must run first.');
    }

    let wavPath = '';

    try {
        wavPath = await downloadToTemp(
            recording.id,
            recording.audioFileName ?? 'audio.wav',
            recording.audioFileKey,
        );

        // Generate audio → text
        const transcript = await transcribeAudio(wavPath);

        // Persist the transcript (idempotent — one transcript per meeting)
        await createTranscript(recording.meetingId, transcript);

        // Analyze transcript and persist meeting intelligence
        await runIntelligencePipeline(transcript, recording.meetingId);
    } finally {
        // Cleanup temp files
        await cleanupTempFiles(wavPath);
    }
};
