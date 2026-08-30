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