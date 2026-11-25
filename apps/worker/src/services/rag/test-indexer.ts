import { chunkTranscript } from './chunker.js';
import { buildRagDocuments } from './document-builder.js';
import { indexDocuments } from './indexer.js';

const meetingId = 'meeting-test-001';

const intelligence = {
    classification: {
        goal: 'Finalize the launch plan for the customer analytics platform and assign tasks.',
    },
    intelligence: {
        keyTopics: [
            'Customer analytics platform launch plan',
            'Backend performance and API load testing',
        ],
        outcomes: [
            'Backend performance fixes to be completed by Friday.',
        ],
        actionItems: [
            {
                task: 'Perform database optimization and caching work',
                owner: 'Speaker 2',
                deadline: 'Friday',
                importance: 'high',
            },
        ],
        decisions: [
            {
                decision: 'Backend performance fixes deadline set for Friday.',
            },
        ],
        risks: [
            {
                risk: 'Lack of sufficient production data.',
                impact: 'Potential testing delays.',
            },
        ],
    },
};

const transcript = `
Speaker 1: Good morning everyone. Today I want to finalize the launch plan.

Speaker 2: The backend is almost ready. Load testing showed performance issues.

Speaker 3: How much time do we need to fix that?

Speaker 2: Around four days. We can optimize database queries and add caching.

Speaker 1: Okay. Let's target Friday for the performance fixes.
`;

const documents = buildRagDocuments(meetingId, intelligence);

const transcriptChunks = chunkTranscript(meetingId, transcript);

await indexDocuments([
    ...documents,
    ...transcriptChunks,
]);

console.log('Meeting indexed successfully');