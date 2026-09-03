import { prisma } from '@repo/db';

type IntelligenceStatus =
    | 'PENDING'
    | 'CLASSIFYING'
    | 'EXTRACTING'
    | 'MERGING'
    | 'READY'
    | 'FAILED';

export const createIntelligenceStatus = async (
    meetingId: string,
) => {
    return prisma.meetingIntelligence.create({
        data: {
            meetingId,
            status: 'PENDING',
        },
    });
};

export const updateIntelligenceStatus = async (
    meetingId: string,
    status: IntelligenceStatus,
) => {
    return prisma.meetingIntelligence.update({
        where: {
            meetingId,
        },
        data: {
            status,
        },
    });
};

export const failIntelligence = async (
    meetingId: string,
    error: unknown,
) => {
    return prisma.meetingIntelligence.update({
        where: { meetingId },
        data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : String(error),
        },
    });
};