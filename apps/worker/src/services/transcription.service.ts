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
    const transcript = await prisma.transcript.create({
        data: {
            meetingId,
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

    return transcript
};
