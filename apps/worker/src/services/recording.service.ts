import { prisma, RecordingStatus } from '@repo/db';
import { MediaFileMetadata } from '../types.js';
import { logger } from '@repo/logger';

export const getRecordingById = async (recordingId: string) => {
    const recording = await prisma.recording.findUnique({
        where: {
            id: recordingId,
        },
    });

    if (!recording) {
        throw new Error(`Recording ${recordingId} not found`);
    }

    // logging
    logger.info(`Got Recording: ${recording.id}`);

    return recording;
};

export const updateRecordingStatus = async (
    recordingId: string,
    status: RecordingStatus,
    error: string | null = null,
) => {
    await prisma.recording.update({
        where: {
            id: recordingId,
        },
        data: {
            status,
            error,
        },
    });

    logger.info(`Recording status updated in DB: ${recordingId} -> ${status}`);
};

export const updateRecording = async (recordingId: string, metadata: MediaFileMetadata) => {
    await prisma.recording.update({
        where: {
            id: recordingId,
        },
        data: {
            duration: metadata.duration,
            size: BigInt(metadata.size),
        },
    });

    // logging
    logger.info(`Recording updated in DB: ${recordingId}`);
};
