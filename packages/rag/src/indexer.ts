import { createHash } from 'node:crypto';

import { qdrantConfig } from './config.js';
import { embedTexts } from './embeddings.js';
import { ensureQdrantCollection, qdrantClient } from './qdrant.js';
import type { RagDocument, TranscriptChunk } from './types.js';

export type IndexableDocument = RagDocument | TranscriptChunk;

function qdrantPointId(documentId: string): string {
    return createHash('sha256')
        .update(documentId)
        .digest('hex')
        .replace(
            /^(.{8})(.{4})(.{4})(.{4})(.{12}).*$/,
            '$1-$2-$3-$4-$5',
        );
}

async function upsertDocuments(
    documents: IndexableDocument[],
    embeddings: number[][],
): Promise<void> {
    await qdrantClient.upsert(qdrantConfig.collection, {
        wait: true,
        points: documents.map((document, index) => ({
            id: qdrantPointId(document.id),
            vector: embeddings[index]!,
            payload: {
                documentId: document.id,
                meetingId: document.meetingId,
                sourceType: document.sourceType,
                content: document.content,
                metadata: document.metadata,
            },
        })),
    });
}

export async function indexDocuments(
    documents: IndexableDocument[],
): Promise<void> {
    if (documents.length === 0) {
        return;
    }

    const embeddings = await embedTexts(
        documents.map((document) => document.content),
    );

    await ensureQdrantCollection();
    await upsertDocuments(documents, embeddings);
}

export async function replaceMeetingDocuments(
    meetingId: string,
    documents: IndexableDocument[],
): Promise<void> {
    const embeddings =
        documents.length > 0
            ? await embedTexts(documents.map((document) => document.content))
            : [];

    await ensureQdrantCollection();
    await deleteMeetingDocuments(meetingId);

    if (documents.length > 0) {
        await upsertDocuments(documents, embeddings);
    }
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
