import type { z } from 'zod';
import {
    completeMultipartUploadSchema,
    createMeetingSchema,
    initiateMultipartUploadSchema,
    multipartUploadPartSchema,
    updateMeetingSchema,
} from '../validation/meeting.validation.js';
import { prisma, RecordingStatus } from '@repo/db';
import { BadRequestException, InternalServerError, NotFoundException } from '../utils/app-error.js';
import {
    completeMultipartUpload,
    createMultipartUpload,
    getMultipartUploadPartUrl,
    headRecording,
    isValidFileExtension,
    isValidMimeType,
} from '@repo/storage';
import { getStorageClient } from '../config/storage.config.js';
import { env } from '../config/app.config.js';
import { getMediaExtractionQueue } from '../config/queue.config.js';
import { JOB_NAMES } from '@repo/queue';

/**
 * Resolves an upload file key only when it belongs to the caller and to the
 * meeting in the URL. Prevents signing or completing another user's upload.
 */
const findOwnedRecordingForUpload = async (
    fileKey: string,
    meetingId: string,
    userId: string,
) => {
    const recording = await prisma.recording.findFirst({
        where: {
            fileKey,
            meeting: { createdById: userId },
        },
        select: {
            id: true,
            meetingId: true,
            fileKey: true,
        },
    });

    if (!recording || recording.meetingId !== meetingId) {
        throw new NotFoundException('Recording not found');
    }

    return recording;
};

export const createMeetingService = async (
    body: z.infer<typeof createMeetingSchema>,
    userId: string,
) => {
    const meeting = await prisma.meeting.create({
        data: {
            title: body.title,
            description: body.description,
            createdById: userId,
        },
        select: {
            id: true,
            title: true,
            description: true,
            status: true,
            createdAt: true,
        },
    });

    if (!meeting) {
        throw new InternalServerError('Failed to create meeting');
    }

    return meeting;
};

export const getMeetingsService = async (userId: string) => {
    const meetings = await prisma.meeting.findMany({
        where: {
            createdById: userId,
        },
    });

    return meetings;
};

export const getMeetingService = async (meetingId: string, userId: string) => {
    const meeting = await prisma.meeting.findFirst({
        where: {
            id: meetingId,
            createdById: userId,
        },
    });

    if (!meeting) {
        throw new NotFoundException('Meeting not found');
    }

    return meeting;
};

export const updateMeetingService = async (
    body: z.infer<typeof updateMeetingSchema>,
    meetingId: string,
    userId: string,
) => {
    const existingMeeting = await prisma.meeting.findFirst({
        where: {
            id: meetingId,
            createdById: userId,
        },
        select: {
            id: true,
        },
    });

    if (!existingMeeting) {
        throw new NotFoundException('Meeting not found');
    }

    const meeting = await prisma.meeting.update({
        where: {
            id: meetingId,
        },
        data: {
            ...(body.title !== undefined && { title: body.title }),
            ...(body.description !== undefined && { description: body.description }),
        },
    });

    return meeting;
};

export const deleteMeetingService = async (meetingId: string, userId: string) => {
    const existingMeeting = await prisma.meeting.findFirst({
        where: {
            id: meetingId,
            createdById: userId,
        },
        select: {
            id: true,
        },
    });

    if (!existingMeeting) {
        throw new NotFoundException('Meeting not found');
    }

    try {
        const meeting = await prisma.meeting.delete({
            where: {
                id: existingMeeting.id,
            },
            select: {
                id: true,
                title: true,
            },
        });

        return meeting;
    } catch (error) {
        // Prisma P2025: Record not found (e.g. deleted between check and delete)
        if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            (error as { code: string }).code === 'P2025'
        ) {
            throw new NotFoundException('Meeting not found');
        }
        throw error;
    }
};

export const initiateMultipartUploadService = async (
    body: z.infer<typeof initiateMultipartUploadSchema>,
    meetingId: string,
    userId: string,
) => {
    const meeting = await prisma.meeting.findFirst({
        where: {
            id: meetingId,
            createdById: userId,
        },
    });

    if (!meeting) {
        throw new NotFoundException('Meeting not found');
    }

    if (!isValidMimeType(body.mimeType) || !isValidFileExtension(body.fileName)) {
        throw new BadRequestException(
            'Unsupported file type. Only audio/video recordings are allowed.',
        );
    }

    const upload = await createMultipartUpload({
        client: getStorageClient(),
        bucket: env.S3_BUCKET_NAME ?? 'meetings',
        meetingId: meeting.id,
        fileName: body.fileName,
        mimeType: body.mimeType,
    });

    // A meeting can have at most one recording (Recording.meetingId is @unique),
    // so re-initiating an upload for a meeting that already has a recording row
    // must replace it rather than crash with a unique-constraint error.
    await prisma.recording.upsert({
        where: {
            meetingId: meeting.id,
        },
        create: {
            meetingId: meeting.id,
            fileName: body.fileName,
            fileKey: upload.fileKey,
            fileUrl: `s3://${env.S3_BUCKET_NAME ?? 'meetings'}/${upload.fileKey}`,
            mimeType: body.mimeType,
            size: 0,
            status: RecordingStatus.UPLOADING,
        },
        update: {
            fileName: body.fileName,
            fileKey: upload.fileKey,
            fileUrl: `s3://${env.S3_BUCKET_NAME ?? 'meetings'}/${upload.fileKey}`,
            mimeType: body.mimeType,
            size: 0,
            status: RecordingStatus.UPLOADING,
        },
    });

    return {
        uploadId: upload.uploadId,
        filekey: upload.fileKey,
    };
};

export const getMultipartUploadPartUrlService = async (
    body: z.infer<typeof multipartUploadPartSchema>,
    meetingId: string,
    userId: string,
) => {
    const recording = await findOwnedRecordingForUpload(
        body.fileKey,
        meetingId,
        userId,
    );

    const url = await getMultipartUploadPartUrl({
        client: getStorageClient(),
        bucket: env.S3_BUCKET_NAME ?? 'meetings',
        fileKey: recording.fileKey,
        uploadId: body.uploadId,
        partNumber: body.partNumber,
    });

    return url;
};

export const completeMultipartUploadService = async (
    body: z.infer<typeof completeMultipartUploadSchema>,
    meetingId: string,
    userId: string,
) => {
    const ownedRecording = await findOwnedRecordingForUpload(
        body.fileKey,
        meetingId,
        userId,
    );

    // Completing is idempotent: if the client retries a complete that already
    // succeeded, MinIO rejects it with NoSuchUpload because the multipart
    // upload no longer exists. Verify the assembled object instead, and treat
    // it as success when the object is already present.
    try {
        await completeMultipartUpload({
            client: getStorageClient(),
            bucket: env.S3_BUCKET_NAME,
            fileKey: ownedRecording.fileKey,
            uploadId: body.uploadId,
            parts: body.parts,
        });
    } catch (error) {
        const check = await headRecording({
            client: getStorageClient(),
            bucket: env.S3_BUCKET_NAME,
            fileKey: ownedRecording.fileKey,
        });

        if (!check.exists) {
            throw error;
        }
    }

    const head = await headRecording({
        client: getStorageClient(),
        bucket: env.S3_BUCKET_NAME,
        fileKey: ownedRecording.fileKey,
    });

    if (!head.exists) {
        throw new NotFoundException('Recording not found');
    }

    if (head.mimeType === undefined || head.size === undefined) {
        throw new InternalServerError('Recording metadata is incomplete');
    }

    if (!isValidMimeType(head.mimeType)) {
        throw new BadRequestException(
            'Unsupported object MIME type. Only audio/video recordings are allowed.',
        );
    }

    if (head.size > env.MAX_UPLOAD_BYTES) {
        throw new BadRequestException(
            `Recording exceeds the maximum upload size of ${env.MAX_UPLOAD_BYTES} bytes.`,
        );
    }

    const recording = await prisma.recording.update({
        where: {
            id: ownedRecording.id,
        },
        data: {
            mimeType: head.mimeType,
            size: head.size,
            status: RecordingStatus.UPLOADED,
        },
    });

    const job = await getMediaExtractionQueue().add(
        JOB_NAMES.EXTRACT_AUDIO,
        {
            recordingId: recording.id,
        },
        {
            jobId: recording.id,
        },
    );

    console.log('Job added:', {
        id: job.id,
        name: job.name,
        data: job.data,
    });

    return recording;
};

export const getMeetingStatusService = async (meetingId: string, userId: string) => {
    const meeting = await prisma.meeting.findFirst({
        where: {
            id: meetingId,
            createdById: userId,
        },
        select: {
            status: true,
            recording: {
                select: {
                    status: true,
                },
            },
            intelligence: {
                select: {
                    status: true,
                    error: true,
                },
            },
        },
    });

    if (!meeting) {
        throw new NotFoundException('Meeting not found');
    }

    return {
        meetingStatus: meeting.status,
        recordingStatus: meeting.recording?.status ?? null,
        intelligenceStatus: meeting.intelligence?.status ?? null,
        error: meeting.intelligence?.error ?? null,
    }
};
