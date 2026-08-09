import { GoogleGenAI } from '@google/genai';
import {
    GenerateTextRequest,
    GenerateTextResponse,
    TextGenerationConfig,
    TextGenerationProvider,
    GenerateStructuredRequest,
} from '../types.js';

export const createGeminiTextProvider = (config: TextGenerationConfig): TextGenerationProvider => {
    const client = new GoogleGenAI({
        apiKey: config.apiKey,
    });

    return {
        async generateText(request: GenerateTextRequest): Promise<GenerateTextResponse> {
            const response = await client.models.generateContent({
                model: config.model,
                contents: request.prompt,
            });

            return {
                text: response.text ?? '',
            };
        },

        async generateStructured(
            request: GenerateStructuredRequest,
        ): Promise<GenerateTextResponse> {
            const response = await client.models.generateContent({
                model: request.model ?? config.model,
                contents: request.prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: request.jsonSchema,
                },
            });

            return {
                text: response.text ?? '',
            };
        },
    };
};
