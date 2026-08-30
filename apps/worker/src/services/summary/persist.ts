import { prisma } from '@repo/db';

export const persistSummary = async (meetingId: string, markdown: string) => {
    return prisma.summary.upsert({
        where: {
            meetingId,
        },

        create: {
            meetingId,
            markdown,
        },

        update: {
            markdown,
        },
    });
};
