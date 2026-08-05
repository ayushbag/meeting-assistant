import { AIConfig, AIProvider, GenerateTextRequest, GenerateTextResponse } from '../types.js';
import { GoogleGenAI } from '@google/genai';

export const createGeminiProvider = (config: AIConfig): AIProvider => {
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
    };
};
