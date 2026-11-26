import { qdrantConfig, retrievalConfig } from './config.js';
import { embedText } from './embeddings.js';
import { qdrantClient } from './qdrant.js';
import type {
    RagDocument,
    RagSourceType,
    RetrieveOptions,
    RetrievedDocument,
} from './types.js';

const RESERVED_PAYLOAD_KEYS = new Set([
    'documentId',
    'meetingId',
    'sourceType',
    'content',
    'metadata',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readMetadata(payload: Record<string, unknown>): Record<string, unknown> {
    if (isRecord(payload.metadata)) {
        return payload.metadata;
    }

    return Object.fromEntries(
        Object.entries(payload).filter(
            ([key]) => !RESERVED_PAYLOAD_KEYS.has(key),
        ),
    );
}

function toDocument(payload: Record<string, unknown>): RagDocument | null {
    const id = payload.documentId;
    const meetingId = payload.meetingId;
    const sourceType = payload.sourceType;
    const content = payload.content;

    if (
        typeof id !== 'string' ||
        typeof meetingId !== 'string' ||
        typeof sourceType !== 'string' ||
        typeof content !== 'string'
    ) {
        return null;
    }

    return {
        id,
        meetingId,
        sourceType: sourceType as RagSourceType,
        content,
        metadata: readMetadata(payload),
    };
}

export async function retrieveDocuments(
    meetingId: string,
    query: string,
    options: RetrieveOptions = {},
): Promise<RetrievedDocument[]> {
    const limit = options.limit ?? retrievalConfig.topK;
    const scoreThreshold =
        options.scoreThreshold ?? retrievalConfig.scoreThreshold;

    const embedding = await embedText(query);

    const results = await qdrantClient.query(qdrantConfig.collection, {
        query: embedding,
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

    return results.points.flatMap((result) => {
        const score = result.score ?? 0;

        if (score < scoreThreshold || !isRecord(result.payload)) {
            return [];
        }

        const document = toDocument(result.payload);

        if (!document) {
            return [];
        }

        return [{ document, score }];
    });
}
