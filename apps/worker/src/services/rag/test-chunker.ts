import { chunkTranscript } from '@repo/rag';

const transcript = `
Speaker 1: Good morning everyone. Today I want to finalize the launch plan.

Speaker 2: The backend is almost ready. Load testing showed performance issues.

Speaker 3: How much time do we need to fix that?

Speaker 2: Around four days. We can optimize database queries and add caching.

Speaker 1: Okay. Let's target Friday for the performance fixes.
`;

const chunks = chunkTranscript('meeting-123', transcript);

console.log(JSON.stringify(chunks, null, 2));