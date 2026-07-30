import { z } from 'zod';

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

export const updateMeetingSchema = z.object({
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
