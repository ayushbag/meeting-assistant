import { ai } from '../../config/ai.config.js';
import { qdrantConfig } from '../../config/qdrant.config.js';

import { RagDocument } from './document-builder.js';
import { TranscriptChunk } from './chunker.js';
import { ensureQdrantCollection, qdrantClient } from './qdrant.js';

import { createHash } from 'node:crypto';

type IndexableDocument = RagDocument | TranscriptChunk;

function qdrantPointId(documentId: string): string {
    return createHash('sha256')
        .update(documentId)
        .digest('hex')
        .replace(
            /^(.{8})(.{4})(.{4})(.{4})(.{12}).*$/,
            '$1-$2-$3-$4-$5',
        );
}

export async function indexDocuments(
    documents: IndexableDocument[],
): Promise<void> {
    if (documents.length === 0) {
        return;
    }

    const embeddings = await ai.embeddings.embedTexts({
        texts: documents.map((document) => document.content),
    });

    await ensureQdrantCollection();

    await qdrantClient.upsert(qdrantConfig.collection, {
        wait: true,
        points: documents.map((document, index) => ({
            id: qdrantPointId(document.id),
            vector: embeddings.embeddings[index]!,
            payload: {
                documentId: document.id,
                meetingId: document.meetingId,
                sourceType: document.sourceType,
                content: document.content,
                ...document.metadata,
            },
        })),
    });
}

export async function deleteMeetingDocuments(
    meetingId: string,
): Promise<void> {
    await qdrantClient.delete(qdrantConfig.collection, {
        wait: true,
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
}