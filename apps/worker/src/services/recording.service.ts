import { prisma } from '@repo/db';

export const getRecordingById = async (recordingId: string) => {
    const recording = await prisma.recording.findUnique({
        where: {
            id: recordingId,
        },
    });

    if (!recording) {
        throw new Error(`Recording ${recordingId} not found`);
    }

    return recording;
};