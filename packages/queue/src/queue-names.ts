export const QUEUE_NAMES = {
    /**
     * CPU-bound ffmpeg extraction (video → 16kHz mono WAV).
     * Kept separate from AI work so extraction bursts never starve
     * the transcription/intelligence queue. Runs on a low-concurrency
     * worker (or Lambda at scale — same processor code).
     */
    MEDIA_EXTRACTION: 'media-extraction',

    /**
     * Network-bound AI work: Gemini transcription + intelligence.
     * Runs on a high-concurrency worker (CPU is idle while waiting
     * on API calls).
     */
    AI_PROCESSING: 'ai-processing',
} as const;
