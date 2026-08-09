export type TextGenerationProviderType = 'gemini' | 'openai' | 'ollama';

export interface TextGenerationConfig {
    provider: TextGenerationProviderType;
    apiKey?: string;
    model: string;
}

export interface GenerateTextRequest {
    prompt: string;
}

export interface GenerateTextResponse {
    text: string;
}

export interface GenerateStructuredRequest {
    prompt: string;

    /**
     * Standard JSON Schema object.
     * The AI provider is responsible for enforcing it
     * if the model supports structured outputs.
     */
    jsonSchema: object;

    /**
     * Optional override.
     * Falls back to TextGenerationConfig.model.
     */
    model?: string;
}

export interface TextGenerationProvider {
    generateText(request: GenerateTextRequest): Promise<GenerateTextResponse>;

    generateStructured(request: GenerateStructuredRequest): Promise<GenerateTextResponse>;
}
