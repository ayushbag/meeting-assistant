import { buildRagDocuments } from './document-builder.js';

const payload = {
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
        decisions: [
            {
                decision: 'Backend performance fixes deadline set for Friday.',
                evidence: {
                    sourceSegment: 1,
                    quote: "Okay. Let's target Friday for the performance fixes.",
                },
            },
        ],
        actionItems: [
            {
                task: 'Perform database optimization and caching work',
                owner: 'Speaker 2',
                deadline: 'Friday',
                importance: 'high',
                evidence: {
                    sourceSegment: 1,
                    quote: "I'll handle the database optimization and caching work.",
                },
            },
        ],
    },
};

const documents = buildRagDocuments('meeting-123', payload);

console.log(JSON.stringify(documents, null, 2));