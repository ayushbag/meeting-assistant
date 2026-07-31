import type { z } from 'zod';
import {
    completeMultipartUploadSchema,
    createMeetingSchema,
    initiateMultipartUploadSchema,
    multipartUploadPartSchema,
    updateMeetingSchema,
} from '../validation/meeting.validation.js';
import { prisma, RecordingStatus } from '@repo/db';
import { InternalServerError, NotFoundException } from '../utils/app-error.js';
import {
    completeMultipartUpload,
    createMultipartUpload,
    getMultipartUploadPartUrl,
    headRecording,
} from '@repo/storage';
import { getStorageClient } from '../config/storage.config.js';
import { env } from '../config/app.config.js';

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

export const getMeetingService = async (meetingId: string) => {
    const meeting = await prisma.meeting.findUnique({
        where: {
            id: meetingId,
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
) => {
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

export const deleteMeetingService = async (meetingId: string) => {
    try {
        const meeting = await prisma.meeting.delete({
            where: {
                id: meetingId,
            },
            select: {
                id: true,
                title: true,
            },
        });

        return meeting;
    } catch (error) {
        // Prisma P2025: Record not found
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
    const meeting = await prisma.meeting.findFirst({
        where: {
            id: meetingId,
            createdById: userId,
        },
    });

    if (!meeting) {
        throw new NotFoundException('Meeting not found');
    }

    const url = await getMultipartUploadPartUrl({
        client: getStorageClient(),
        bucket: env.S3_BUCKET_NAME ?? 'meetings',
        fileKey: body.fileKey,
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
    const meeting = await prisma.meeting.findFirst({
        where: {
            id: meetingId,
            createdById: userId,
        },
    });

    if (!meeting) {
        throw new NotFoundException('Meeting not found');
    }

    // Completing is idempotent: if the client retries a complete that already
    // succeeded, MinIO rejects it with NoSuchUpload because the multipart
    // upload no longer exists. Verify the assembled object instead, and treat
    // it as success when the object is already present.
    try {
        await completeMultipartUpload({
            client: getStorageClient(),
            bucket: env.S3_BUCKET_NAME,
            fileKey: body.fileKey,
            uploadId: body.uploadId,
            parts: body.parts,
        });
    } catch (error) {
        const check = await headRecording({
            client: getStorageClient(),
            bucket: env.S3_BUCKET_NAME,
            fileKey: body.fileKey,
        });

        if (!check.exists) {
            throw error;
        }
    }

    const head = await headRecording({
        client: getStorageClient(),
        bucket: env.S3_BUCKET_NAME,
        fileKey: body.fileKey,
    });

    if (!head.exists) {
        throw new NotFoundException('Recording not found');
    }

    if (head.mimeType === undefined || head.size === undefined) {
        throw new InternalServerError('Recording metadata is incomplete');
    }

    const recording = await prisma.recording.update({
        where: {
            fileKey: body.fileKey,
        },
        data: {
            mimeType: head.mimeType,
            size: head.size,
            status: RecordingStatus.UPLOADED,
        },
    });

    return recording;
};
