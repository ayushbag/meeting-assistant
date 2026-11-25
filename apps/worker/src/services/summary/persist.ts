import { prisma } from '@repo/db';

type PersistSummaryOptions = {
    promptVersion?: string;
    model?: string;
};

export const persistSummary = async (
    meetingId: string,
    markdown: string,
    options: PersistSummaryOptions = {},
) => {
    return prisma.summary.upsert({
        where: {
            meetingId,
        },

        create: {
            meetingId,
            markdown,
            promptVersion: options.promptVersion,
            model: options.model,
        },

        update: {
            markdown,
            promptVersion: options.promptVersion,
            model: options.model,
        },
    });
};
