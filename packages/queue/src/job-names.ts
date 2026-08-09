export const JOB_NAMES = {
    /** Download source recording → ffprobe → ffmpeg → upload WAV → delete video → enqueue AI job. */
    EXTRACT_AUDIO: 'extract-audio',

    /** Download WAV → Gemini transcription → persist transcript. */
    PROCESS_AI: 'process-ai',
} as const;
