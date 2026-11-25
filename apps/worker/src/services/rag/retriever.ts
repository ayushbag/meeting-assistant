import { ai } from '../../config/ai.config.js';
import { qdrantConfig } from '../../config/qdrant.config.js';
import { qdrantClient } from './qdrant.js';

export interface RetrievedDocument {
    score: number;
    documentId?: string;
    meetingId?: string;
    sourceType?: string;
    content: string;
    metadata: Record<string, unknown>;
}

export async function retrieveDocuments(
    meetingId: string,
    query: string,
    limit = 5,
): Promise<RetrievedDocument[]> {
    const embedding = await ai.embeddings.embedText({
        text: query,
    });

    const results = await qdrantClient.query(qdrantConfig.collection, {
        query: embedding.embedding,
        limit,
        with_payload: true,
        filter: {
            must: [
                {
                    key: 'meetingId',
                    match: {
                        value: meetingId,
                    },
                },
            ],
        },
    });

    return results.points.map((result) => {
        const payload = result.payload ?? {};

        return {
            score: result.score ?? 0,
            documentId: payload.documentId as string | undefined,
            meetingId: payload.meetingId as string | undefined,
            sourceType: payload.sourceType as string | undefined,
            content: payload.content as string,
            metadata: payload,
        };
    });
}