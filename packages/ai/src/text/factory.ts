import { createGeminiTextProvider } from './providers/gemini.provider.js';
import { TextGenerationConfig, TextGenerationProvider } from './types.js';

export const createTextGenerationProvider = (
    config: TextGenerationConfig,
): TextGenerationProvider => {
    switch (config.provider) {
        case 'gemini':
            return createGeminiTextProvider(config);

        default:
            throw new Error(`Unsupported text generation provider: ${config.provider}`);
    }
};
