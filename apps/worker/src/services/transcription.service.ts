import { prisma } from '@repo/db';
import { ai } from '../config/ai.config.js';
import { logger } from '@repo/logger';

export const transcribeAudio = async (wavPath: string): Promise<string> => {
    const response = await ai.speech.transcribe({
        audioPath: wavPath,
        mimeType: 'audio/wav',
    });

    logger.info(
        {
            transcriptLength: response.text.length,
        },
        'Audio transcribed successfully',
    );

    return response.text;
};

export const createTranscript = async (meetingId: string, content: string) => {
    // Upsert (Transcript.meetingId is @unique) so a retried AI job never crashes
    // on a duplicate after the first attempt already persisted the transcript.
    const transcript = await prisma.transcript.upsert({
        where: {
            meetingId,
        },
        create: {
            meetingId,
            content,
        },
        update: {
            content,
        },
    });

    logger.info(
        {
            meetingId,
            transcriptId: transcript.id,
        },
        'Transcript created',
    );

    return transcript;
};
