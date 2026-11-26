import { prisma } from '@repo/db';
import { NotFoundException } from '../utils/app-error.js';

const getOwnedMeeting = async (meetingId: string, userId: string) => {
    const meeting = await prisma.meeting.findFirst({
        where: {
            id: meetingId,
            createdById: userId,
        },
        select: {
            id: true,
        },
    });

    if (!meeting) {
        throw new NotFoundException('Meeting not found');
    }

    return meeting;
};

export const getTranscriptResultService = async (
    meetingId: string,
    userId: string,
) => {
    await getOwnedMeeting(meetingId, userId);

    const transcript = await prisma.transcript.findUnique({
        where: { meetingId },
        select: {
            meetingId: true,
            content: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!transcript) {
        throw new NotFoundException('Transcript not found');
    }

    return transcript;
};

export const getSummaryResultService = async (
    meetingId: string,
    userId: string,
) => {
    await getOwnedMeeting(meetingId, userId);

    const summary = await prisma.summary.findUnique({
        where: { meetingId },
        select: {
            meetingId: true,
            markdown: true,
            promptVersion: true,
            model: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!summary) {
        throw new NotFoundException('Summary not found');
    }

    return summary;
};

export const getIntelligenceResultService = async (
    meetingId: string,
    userId: string,
) => {
    await getOwnedMeeting(meetingId, userId);

    const intelligence = await prisma.meetingIntelligence.findUnique({
        where: { meetingId },
        select: {
            meetingId: true,
            meetingType: true,
            confidence: true,
            status: true,
            payload: true,
            promptVersion: true,
            model: true,
            error: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!intelligence) {
        throw new NotFoundException('Intelligence not found');
    }

    return {
        meetingId: intelligence.meetingId,
        type: intelligence.meetingType,
        confidence: intelligence.confidence,
        status: intelligence.status,
        payload: intelligence.payload,
        promptVersion: intelligence.promptVersion,
        model: intelligence.model,
        error: intelligence.error,
        createdAt: intelligence.createdAt,
        updatedAt: intelligence.updatedAt,
    };
};
