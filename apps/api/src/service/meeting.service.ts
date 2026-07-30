import type { z } from "zod";
import { createMeetingSchema, updateMeetingSchema } from "../validation/meeting.validation.js";
import { prisma } from "@repo/db";
import { InternalServerError, NotFoundException } from "../utils/app-error.js";

export const createMeetingService = async (body: z.infer<typeof createMeetingSchema>, userId: string) => {
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
        throw new InternalServerError("Failed to create meeting");
    }

    return meeting;
}

export const getMeetingsService = async (userId: string) => {
    const meetings = await prisma.meeting.findMany({
        where: {
            createdById: userId
        }
    })

    return meetings;
}

export const getMeetingService = async (meetingId: string) => {
    const meeting = await prisma.meeting.findUnique({
        where: {
            id: meetingId
        }
    })

    if (!meeting) {
        throw new NotFoundException("Meeting not found");
    }

    return meeting;
}

export const updateMeetingService = async (body: z.infer<typeof updateMeetingSchema>, meetingId: string) => {
    const meeting = await prisma.meeting.update({
        where: {
            id: meetingId
        },
        data: {
            ...(body.title !== undefined && { title: body.title }),
            ...(body.description !== undefined && { description: body.description }),
        },
    });

    return meeting;
}

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
        if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
            throw new NotFoundException("Meeting not found");
        }
        throw error;
    }
}