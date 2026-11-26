import { ensureQdrantCollection } from '@repo/rag';

await ensureQdrantCollection();

console.log('Qdrant collection ready');