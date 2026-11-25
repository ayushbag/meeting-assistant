import { GoogleGenAI } from '@google/genai';

import {
    EmbedTextRequest,
    EmbedTextsRequest,
    EmbedTextResponse,
    EmbedTextsResponse,
    EmbeddingsConfig,
    EmbeddingsProvider,
} from '../types.js';

export const createGeminiEmbeddingsProvider = (
    config: EmbeddingsConfig,
): EmbeddingsProvider => {
    const client = new GoogleGenAI({
        apiKey: config.apiKey,
    });

    return {
        async embedText(
            request: EmbedTextRequest,
        ): Promise<EmbedTextResponse> {
            const response = await client.models.embedContent({
                model: config.model,
                contents: request.text,
                config: config.outputDimensionality
                    ? {
                          outputDimensionality: config.outputDimensionality,
                      }
                    : undefined,
            });

            const embedding = response.embeddings?.[0]?.values;

            if (!embedding) {
                throw new Error('Gemini returned no embedding');
            }

            return {
                embedding,
            };
        },

        async embedTexts(
            request: EmbedTextsRequest,
        ): Promise<EmbedTextsResponse> {
            const response = await client.models.embedContent({
                model: config.model,
                contents: request.texts,
                config: config.outputDimensionality
                    ? {
                          outputDimensionality: config.outputDimensionality,
                      }
                    : undefined,
            });

            const embeddings = response.embeddings?.map(
                (embedding) => embedding.values ?? [],
            );

            if (!embeddings || embeddings.length !== request.texts.length) {
                throw new Error('Gemini returned invalid embeddings');
            }

            return {
                embeddings,
            };
        },
    };
};