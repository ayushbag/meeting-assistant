import { createGeminiSpeechProvider } from './providers/gemini.provider.js';
import { SpeechToTextConfig, SpeechToTextProvider } from './types.js';

export const createSpeechToTextProvider = (
    config: SpeechToTextConfig,
): SpeechToTextProvider => {
    switch (config.provider) {
        case 'gemini':
            return createGeminiSpeechProvider(config);

        default:
            throw new Error(`Unsupported speech-to-text provider: ${config.provider}`);
    }
};
