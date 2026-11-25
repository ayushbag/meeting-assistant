import { ensureQdrantCollection } from './qdrant.js';

await ensureQdrantCollection();

console.log('Qdrant collection ready');