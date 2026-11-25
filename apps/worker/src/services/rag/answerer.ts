import { ai } from '../../config/ai.config.js';
import type { RetrievedDocument } from './retriever.js';

export interface RagAnswerRequest {
    question: string;
    documents: RetrievedDocument[];
}

export async function generateRagAnswer(
    request: RagAnswerRequest,
): Promise<string> {
    if (request.documents.length === 0) {
        return "I couldn't find relevant information in this meeting.";
    }

    const context = request.documents
        .map(
            (document, index) =>
                `[Source ${index + 1}]
                Type: ${document.sourceType}
                Content:
                ${document.content}`,
        )
        .join('\n\n');

    const prompt = `You are an AI meeting assistant.

        Answer the user's question using ONLY the meeting context provided below.

        Rules:
        - Do not invent or assume information.
        - If the answer is not present in the context, say that the information is not available in the meeting.
        - Give a concise, direct answer.
        - Combine information from multiple sources when useful.

        Meeting context:
        ${context}

        User question:
        ${request.question}

        Answer:`;

    const response = await ai.text.generateText({
        prompt,
    });

    return response.text.trim();
}