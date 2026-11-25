import { QdrantClient } from '@qdrant/js-client-rest';

import { qdrantConfig } from '../../config/qdrant.config.js';

export const qdrantClient = new QdrantClient({
    url: qdrantConfig.url,
});

export async function ensureQdrantCollection(): Promise<void> {
    const collections = await qdrantClient.getCollections();

    const exists = collections.collections.some(
        (collection) => collection.name === qdrantConfig.collection,
    );

    if (exists) {
        return;
    }

    await qdrantClient.createCollection(qdrantConfig.collection, {
        vectors: {
            size: 768,
            distance: 'Cosine',
        },
    });
}   