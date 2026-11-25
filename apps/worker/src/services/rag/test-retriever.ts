import { retrieveDocuments } from './retriever.js';

const results = await retrieveDocuments(
    'meeting-test-001',
    'What were the backend performance issues?',
);

console.dir(results, { depth: null });