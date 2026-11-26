import { ChatRole, Prisma, prisma } from '@repo/db';
import {
    generateRagAnswer,
    retrieveDocuments,
    type RagAnswerResponse,
    type RagConversationTurn,
} from '@repo/rag';

import { BadRequestException, NotFoundException } from '../utils/app-error.js';

const HISTORY_TURN_LIMIT = 8;

const findOwnedMeeting = async (meetingId: string, userId: string) => {
    const meeting = await prisma.meeting.findFirst({
        where: {
            id: meetingId,
            createdById: userId,
        },
        select: { id: true },
    });

    if (!meeting) {
        throw new NotFoundException('Meeting not found');
    }

    return meeting;
};

const loadRecentTurns = async (
    meetingId: string,
): Promise<RagConversationTurn[]> => {
    const messages = await prisma.chatMessage.findMany({
        where: { meetingId },
        orderBy: { createdAt: 'desc' },
        take: HISTORY_TURN_LIMIT,
        select: { role: true, message: true },
    });

    return messages.reverse().map((message) => ({
        role:
            message.role === ChatRole.USER
                ? ('user' as const)
                : ('assistant' as const),
        content: message.message,
    }));
};

export const getChatMessagesService = async (
    meetingId: string,
    userId: string,
) => {
    await findOwnedMeeting(meetingId, userId);

    return prisma.chatMessage.findMany({
        where: { meetingId },
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            role: true,
            message: true,
            citations: true,
            createdAt: true,
        },
    });
};

export const askMeetingQuestionService = async (
    meetingId: string,
    userId: string,
    question: string,
): Promise<{
    userMessage: { id: string };
    assistantMessage: { id: string };
    answer: RagAnswerResponse;
}> => {
    if (!question.trim()) {
        throw new BadRequestException('Question cannot be empty');
    }

    const meeting = await findOwnedMeeting(meetingId, userId);
    const history = await loadRecentTurns(meeting.id);

    const documents = await retrieveDocuments(meeting.id, question);
    const answer = await generateRagAnswer({
        question,
        documents,
        history,
    });

    const [userMessage, assistantMessage] = await prisma.$transaction([
        prisma.chatMessage.create({
            data: {
                meetingId: meeting.id,
                role: ChatRole.USER,
                message: question,
            },
            select: { id: true },
        }),
        prisma.chatMessage.create({
            data: {
                meetingId: meeting.id,
                role: ChatRole.ASSISTANT,
                message: answer.answer,
                citations: answer.citations as unknown as Prisma.InputJsonValue,
            },
            select: { id: true },
        }),
    ]);

    return { userMessage, assistantMessage, answer };
};
