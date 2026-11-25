import { ai } from '../../config/ai.config.js';

export async function embedText(text: string): Promise<number[]> {
    const result = await ai.embeddings.embedText({ text });

    return result.embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
    const result = await ai.embeddings.embedTexts({ texts });

    return result.embeddings;
}