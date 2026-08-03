import { logger } from "@repo/logger";
import { getRecordingWorker } from "./config/worker.config.js";

const worker = getRecordingWorker();

worker.on('ready', () => {
    console.log('✅ Recording worker is ready');
})

worker.on('active', (job) => {
    console.log(`🚀 Processing job ${job.id}`);
});

worker.on('completed', (job) => {
    console.log(`✅ Completed job ${job.id}`);
});

worker.on('failed', (job, err) => {
    logger.error({
        jobId: job?.id,
        queue: job?.queueName,
        error: err
    })
});

console.log('🎧 Listening for recording jobs...');