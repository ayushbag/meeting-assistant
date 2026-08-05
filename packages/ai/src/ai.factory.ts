import { createGeminiProvider } from './providers/gemini.provider.js';
import { AIConfig, AIProvider } from './types.js';

export const createAI = (config: AIConfig): AIProvider => {
    switch (config.provider) {
        case 'gemini':
            return createGeminiProvider(config);

        default:
            throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
};
