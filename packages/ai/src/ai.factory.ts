import { createEmbeddingsProvider } from './embeddings/factory.js';
import type { EmbeddingsProvider } from './embeddings/types.js';
import { createSpeechToTextProvider } from './speech/factory.js';
import type { SpeechToTextProvider } from './speech/types.js';
import { createTextGenerationProvider } from './text/factory.js';
import type { TextGenerationProvider } from './text/types.js';
import { AIConfig } from './types.js';

export interface AI {
    text: TextGenerationProvider;
    speech: SpeechToTextProvider;
    embeddings: EmbeddingsProvider;
}

export const createAI = (config: AIConfig): AI => ({
    text: createTextGenerationProvider(config.textGeneration),
    speech: createSpeechToTextProvider(config.speechToText),
    embeddings: createEmbeddingsProvider(config.embeddings),
});