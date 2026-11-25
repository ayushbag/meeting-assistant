import { createGeminiEmbeddingsProvider } from './providers/gemini.provider.js';
import {
    EmbeddingsConfig,
    EmbeddingsProvider,
} from './types.js';

export const createEmbeddingsProvider = (
    config: EmbeddingsConfig,
): EmbeddingsProvider => {
    switch (config.provider) {
        case 'gemini':
            return createGeminiEmbeddingsProvider(config);

        default:
            throw new Error(
                `Unsupported embeddings provider: ${config.provider}`,
            );
    }
};