import assert from 'node:assert/strict';

import {
    generateRagAnswer,
    NO_ANSWER_MESSAGE,
    retrieveDocuments,
} from '@repo/rag';

const meetingId = 'cmtflfv77000178tubw77m0in';

const questions = [
    "What is the CEO's favorite color?",
    'What budget was approved for the Berlin office?',
];

const results: Array<{
    question: string;
    retrievedDocumentCount: number;
    state: string;
    answer: string;
    citationCount: number;
}> = [];

for (const question of questions) {
    const documents = await retrieveDocuments(meetingId, question);
    const answer = await generateRagAnswer({ question, documents });

    assert.equal(answer.state, 'no-answer');
    assert.equal(answer.answer, NO_ANSWER_MESSAGE);
    assert.equal(answer.citations.length, 0);

    results.push({
        question,
        retrievedDocumentCount: documents.length,
        state: answer.state,
        answer: answer.answer,
        citationCount: answer.citations.length,
    });
}

console.log(JSON.stringify(results, null, 2));
