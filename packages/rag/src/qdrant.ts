import { QdrantClient } from '@qdrant/js-client-rest';

import { qdrantConfig } from './config.js';

export const qdrantClient = new QdrantClient({
    url: qdrantConfig.url,
});

let collectionReady: Promise<void> | null = null;

async function createCollectionIfMissing(): Promise<void> {
    const exists = await qdrantClient.collectionExists(qdrantConfig.collection);

    if (exists.exists) {
        return;
    }

    try {
        await qdrantClient.createCollection(qdrantConfig.collection, {
            vectors: {
                size: qdrantConfig.vectorSize,
                distance: 'Cosine',
            },
        });
    } catch (error) {
        // Another worker may have created it between the check and create call.
        const existsAfterRace = await qdrantClient
            .collectionExists(qdrantConfig.collection)
            .catch(() => ({ exists: false }));

        if (!existsAfterRace.exists) {
            throw error;
        }
    }
}

export function ensureQdrantCollection(): Promise<void> {
    if (!collectionReady) {
        collectionReady = createCollectionIfMissing().finally(() => {
            collectionReady = null;
        });
    }

    return collectionReady;
}
