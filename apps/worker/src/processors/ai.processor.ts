import { Job } from 'bullmq';
import { prisma } from '@repo/db';
import { AI_STAGES, type AIProcessingJob } from '@repo/queue';
import { logger } from '@repo/logger';

import { env } from '../config/app.config.js';
import { getRecordingById } from '../services/recording.service.js';
import {
    markCompleted,
    markFailed,
    markSummarizing,
    startAIProcessing,
} from '../services/meeting-status.service.js';
import { downloadToTemp } from '../services/storage.service.js';
import { cleanupTempFiles } from '../services/media.service.js';
import {
    createTranscript,
    isUsableTranscript,
    transcribeAudio,
} from '../services/transcription.service.js';
import { runIntelligencePipeline } from '../services/intelligence/pipeline.js';
import { indexMeetingForRag } from '../services/rag/indexing.service.js';
import { runSummaryPipeline } from '../services/summary/pipeline.js';

/**
 * AI-processing job (high concurrency — this step is network-bound):
 *
 * download extracted WAV → Gemini transcription → persist transcript →
 * generate summary and analyze meeting intelligence in parallel.
 *
 * Runs on the same box as the media worker but on its own queue, so ffmpeg
 * bursts can never starve it (learning/architecture-decisions.md §6/§7).
 */
export const processAIJob = async (job: Job<AIProcessingJob>) => {
    const fromIntelligence = job.data.fromStage === AI_STAGES.INTELLIGENCE;

    logger.info(
        {
            recordingId: job.data.recordingId,
            fromStage: job.data.fromStage ?? AI_STAGES.TRANSCRIPTION,
        },
        fromIntelligence ? 'Resuming intelligence from stored transcript...' : 'Transcribing audio...',
    );

    const recording = await getRecordingById(job.data.recordingId);

    let wavPath = '';

    try {
        let transcript: string;

        if (fromIntelligence) {
            // Transcript is already durable: skip download and Gemini speech entirely.
            await markSummarizing(recording.id, recording.meetingId);

            const stored = await prisma.transcript.findUnique({
                where: { meetingId: recording.meetingId },
                select: { content: true },
            });

            if (!stored?.content?.trim()) {
                throw new Error('Stored transcript is missing or empty; cannot resume intelligence.');
            }

            transcript = stored.content;
        } else {
            await startAIProcessing(recording.id, recording.meetingId);

            if (!recording.audioFileKey) {
                throw new Error('Recording has no extracted audio; media-extraction job must run first.');
            }

            wavPath = await downloadToTemp(
                recording.id,
                recording.audioFileName ?? 'audio.wav',
                recording.audioFileKey,
            );

            transcript = await transcribeAudio(wavPath);

            // Upsert keeps one transcript row even when an earlier attempt succeeded.
            await createTranscript(recording.meetingId, transcript);

            if (!isUsableTranscript(transcript)) {
                logger.info(
                    {
                        meetingId: recording.meetingId,
                        length: transcript.trim().length,
                        minimum: env.MIN_TRANSCRIPT_CHARS,
                    },
                    'Transcript below minimum; skipping intelligence extraction',
                );
            }

            // Transcript is durable; summary and intelligence can now run in parallel.
            await markSummarizing(recording.id, recording.meetingId);
        }

        // Generate the Markdown summary and persist meeting intelligence.
        await Promise.all([
            runSummaryPipeline(transcript, recording.meetingId),
            runIntelligencePipeline(transcript, recording.meetingId),
        ]);

        await indexMeetingForRag(recording.meetingId);

        await markCompleted(recording.id, recording.meetingId);
    } catch (error) {
        await markFailed(recording.id, recording.meetingId, error);
        throw error;
    } finally {
        // Cleanup temp files
        await cleanupTempFiles(wavPath);
    }
};
