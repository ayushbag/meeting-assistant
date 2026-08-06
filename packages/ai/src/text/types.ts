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

export interface TextGenerationProvider {
    generateText(request: GenerateTextRequest): Promise<GenerateTextResponse>;
}
