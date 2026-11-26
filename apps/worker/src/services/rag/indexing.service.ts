import { prisma } from '@repo/db';
import { logger } from '@repo/logger';
import { chunkTranscript, replaceMeetingDocuments } from '@repo/rag';

import {
    buildRagDocuments,
    type MeetingIntelligencePayload,
} from './document-builder.js';

export const indexMeetingForRag = async (meetingId: string): Promise<void> => {
    const [transcript, intelligence] = await Promise.all([
        prisma.transcript.findUnique({
            where: { meetingId },
            select: { content: true },
        }),
        prisma.meetingIntelligence.findUnique({
            where: { meetingId },
            select: { goal: true, payload: true },
        }),
    ]);

    if (!transcript) {
        throw new Error(
            `Cannot index meeting ${meetingId}: transcript is missing.`,
        );
    }

    if (!intelligence) {
        throw new Error(
            `Cannot index meeting ${meetingId}: intelligence is missing.`,
        );
    }

    const documents = [
        ...buildRagDocuments(meetingId, {
            classification: { goal: intelligence.goal ?? undefined },
            intelligence:
                intelligence.payload as MeetingIntelligencePayload['intelligence'],
        }),
        ...chunkTranscript(meetingId, transcript.content),
    ];

    await replaceMeetingDocuments(meetingId, documents);

    logger.info(
        { meetingId, documentCount: documents.length },
        'Meeting indexed for RAG',
    );
};
