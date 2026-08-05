export type AIProviderType =
    | 'gemini'
    | 'openai'
    | 'ollama';

export interface AIConfig {
    provider: AIProviderType;
    apiKey?: string;
    model: string;
}

export interface GenerateTextRequest {
    prompt: string;
}

export interface GenerateTextResponse {
    text: string;
}

export interface AIProvider {
    generateText(
        request: GenerateTextRequest,
    ): Promise<GenerateTextResponse>
}