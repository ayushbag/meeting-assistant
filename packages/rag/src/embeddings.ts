import { ai } from './config.js';

const EMBEDDING_BATCH_SIZE = 64;

export async function embedText(text: string): Promise<number[]> {
    const result = await ai.embeddings.embedText({ text });

    return result.embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (let index = 0; index < texts.length; index += EMBEDDING_BATCH_SIZE) {
        const batch = texts.slice(index, index + EMBEDDING_BATCH_SIZE);
        const result = await ai.embeddings.embedTexts({ texts: batch });

        embeddings.push(...result.embeddings);
    }

    return embeddings;
}
