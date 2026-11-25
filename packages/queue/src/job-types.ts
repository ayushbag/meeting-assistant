import type { AIStage } from './job-names.js';

export interface MediaExtractionJob {
    recordingId: string;
    /** Unique per enqueue so a retained failed job never blocks a retry. */
    attemptId?: string;
}

export interface AIProcessingJob {
    recordingId: string;
    /** Unique per enqueue so a retained failed job never blocks a retry. */
    attemptId?: string;
    /** Resume point. Omitted means start at transcription. */
    fromStage?: AIStage;
}
