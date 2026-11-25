export const JOB_NAMES = {
    /** Download source recording → ffprobe → ffmpeg → upload WAV → delete video → enqueue AI job. */
    EXTRACT_AUDIO: 'extract-audio',

    /** Download WAV → Gemini transcription → persist transcript → intelligence. */
    PROCESS_AI: 'process-ai',
} as const;

/** Stages an AI job can resume from without losing already-persisted work. */
export const AI_STAGES = {
    TRANSCRIPTION: 'transcription',
    INTELLIGENCE: 'intelligence',
} as const;

export type AIStage = (typeof AI_STAGES)[keyof typeof AI_STAGES];
