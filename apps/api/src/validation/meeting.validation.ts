import { z } from 'zod';
import { MeetingStatus, MeetingType } from '@repo/db';
import { isValidFileExtension, isValidMimeType } from '@repo/storage';

export const meetingIdParamSchema = z.object({
    meetingId: z.string().trim().min(1, 'Meeting ID is required'),
});

export const listMeetingsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.nativeEnum(MeetingStatus).optional(),
    type: z.nativeEnum(MeetingType).optional(),
    sort: z
        .enum(['createdAt', 'updatedAt', 'title', 'status', 'type'])
        .default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
});

export const sendChatMessageSchema = z.object({
    message: z
        .string()
        .trim()
        .min(1, 'Message is required')
        .max(4000, 'Message cannot exceed 4000 characters'),
});

export const createMeetingSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, 'Title is required')
        .max(255, 'Title cannot exceed 255 characters'),

    description: z
        .string()
        .trim()
        .max(5000, 'Description cannot exceed 5000 characters')
        .optional(),
});

export const updateMeetingSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(1, 'Title is required')
            .max(255, 'Title cannot exceed 255 characters')
            .optional(),

        description: z
            .string()
            .trim()
            .max(5000, 'Description cannot exceed 5000 characters')
            .optional(),
    })
    .refine((data) => data.title !== undefined || data.description !== undefined, {
        message: 'At least one field must be provided for update.',
    });

export const updateMeetingTypeSchema = z.object({
    type: z.nativeEnum(MeetingType),
});

export const initiateMultipartUploadSchema = z.object({
    fileName: z
        .string()
        .trim()
        .min(1, 'File name is required')
        .max(255)
        .refine(isValidFileExtension, {
            message: 'Unsupported file extension. Only audio/video files are allowed.',
        }),

    mimeType: z
        .string()
        .trim()
        .min(1, 'MIME type is required')
        .refine(isValidMimeType, {
            message: 'Unsupported MIME type. Only audio/video files are allowed.',
        }),
});

export const multipartUploadPartSchema = z.object({
    uploadId: z.string().trim().min(1),
    fileKey: z.string().trim().min(1),
    partNumber: z.number().int().positive(),
});

export const multipartUploadIdentitySchema = z.object({
    uploadId: z.string().trim().min(1, 'Upload ID is required'),
    fileKey: z.string().trim().min(1, 'File key is required'),
});

export const abortMultipartUploadSchema = multipartUploadIdentitySchema;
export const listMultipartUploadPartsSchema = multipartUploadIdentitySchema;

export const completeMultipartUploadSchema = z.object({
    uploadId: z.string().trim().min(1),
    fileKey: z.string().trim().min(1),
    parts: z
        .array(
            z.object({
                partNumber: z.number().int().positive(),
                etag: z.string().trim().min(1),
            }),
        )
        .min(1),
});
