import { Worker } from 'bullmq';
import { logger } from '@repo/logger';
import { getAIWorker, getMediaExtractionWorker } from './config/worker.config.js';

const registerWorkerEvents = (worker: Worker, label: string) => {
    worker.on('ready', () => {
        console.log(`✅ ${label} worker is ready`);
    });

    worker.on('active', (job) => {
        console.log(`🚀 [${label}] Processing job ${job.id}`);
    });

    worker.on('completed', (job) => {
        console.log(`✅ [${label}] Completed job ${job.id}`);
    });

    worker.on('failed', (job, err) => {
        logger.error({
            jobId: job?.id,
            queue: job?.queueName,
            error: err,
        });
    });
};

// Media worker: CPU-bound ffmpeg extraction (concurrency 1–2).
const mediaWorker = getMediaExtractionWorker();
registerWorkerEvents(mediaWorker, 'media-extraction');

// AI worker: network-bound transcription + intelligence (high concurrency).
const aiWorker = getAIWorker();
registerWorkerEvents(aiWorker, 'ai-processing');

console.log('🎧 Listening for media-extraction and ai-processing jobs...');
