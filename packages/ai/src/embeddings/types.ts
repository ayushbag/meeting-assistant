export type EmbeddingsProviderType = 'gemini';

export interface EmbeddingsConfig {
    provider: EmbeddingsProviderType;
    apiKey?: string;
    model: string;
    outputDimensionality?: number;
}

export interface EmbedTextRequest {
    text: string;
}

export interface EmbedTextsRequest {
    texts: string[];
}

export interface EmbedTextResponse {
    embedding: number[];
}

export interface EmbedTextsResponse {
    embeddings: number[][];
}

export interface EmbeddingsProvider {
    embedText(request: EmbedTextRequest): Promise<EmbedTextResponse>;

    embedTexts(request: EmbedTextsRequest): Promise<EmbedTextsResponse>;
}