import { prisma } from '@repo/db';

type IntelligenceStatus =
    | 'PENDING'
    | 'CLASSIFYING'
    | 'EXTRACTING'
    | 'MERGING'
    | 'READY'
    | 'FAILED';

/**
 * Reset the intelligence status for a run. Upsert makes retries safe: a job
 * that failed previously can create a fresh PENDING row instead of crashing
 * on the unique meetingId constraint.
 */
export const createIntelligenceStatus = async (
    meetingId: string,
) => {
    return prisma.meetingIntelligence.upsert({
        where: { meetingId },
        create: {
            meetingId,
            status: 'PENDING',
        },
        update: {
            status: 'PENDING',
            error: null,
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
