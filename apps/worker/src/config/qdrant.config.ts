import { env } from './app.config.js';

export const qdrantConfig = {
    url: env.QDRANT_URL,
    collection: env.QDRANT_COLLECTION,
};