import 'dotenv/config';

import { createAI } from '@repo/ai';
import z from 'zod';

const envSchema = z.object({
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string(),
    GEMINI_SPEECH_MODEL: z.string(),
    GEMINI_EMBEDDING_MODEL: z.string(),
    QDRANT_URL: z.url(),
    QDRANT_COLLECTION: z.string(),
    RAG_SCORE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.35),
    RAG_TOP_K: z.coerce.number().int().positive().default(5),
});

const env = envSchema.parse(process.env);

export const embeddingConfig = {
    model: env.GEMINI_EMBEDDING_MODEL,
    outputDimensionality: 768,
};

export const qdrantConfig = {
    url: env.QDRANT_URL,
    collection: env.QDRANT_COLLECTION,
    vectorSize: embeddingConfig.outputDimensionality,
};

export const retrievalConfig = {
    scoreThreshold: env.RAG_SCORE_THRESHOLD,
    topK: env.RAG_TOP_K,
};

export const ai = createAI({
    textGeneration: {
        provider: 'gemini',
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL,
    },
    speechToText: {
        provider: 'gemini',
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_SPEECH_MODEL,
    },
    embeddings: {
        provider: 'gemini',
        apiKey: env.GEMINI_API_KEY,
        model: embeddingConfig.model,
        outputDimensionality: embeddingConfig.outputDimensionality,
    },
});
