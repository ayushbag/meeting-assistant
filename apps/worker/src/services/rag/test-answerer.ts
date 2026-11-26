import assert from 'node:assert/strict';

import { generateRagAnswer, retrieveDocuments } from '@repo/rag';

const meetingId = 'cmtflfv77000178tubw77m0in';

const question =
    'When and where did they agree to meet, and who will share the cafe location?';

const documents = await retrieveDocuments(meetingId, question);
const answer = await generateRagAnswer({ question, documents });

assert.equal(answer.state, 'answered');
assert.ok(answer.citations.length > 0, 'Expected at least one citation');

for (const citation of answer.citations) {
    const exists = documents.some(({ document }) =>
        document.content.includes(citation.quote),
    );

    assert.ok(exists, `Citation quote not found in stored document: ${citation.quote}`);
}

const absentQuestion = "What is the CEO's favorite color?";
const absentDocuments = await retrieveDocuments(meetingId, absentQuestion);
const absentAnswer = await generateRagAnswer({
    question: absentQuestion,
    documents: absentDocuments,
});

assert.equal(absentAnswer.state, 'no-answer');

const followupDocuments = await retrieveDocuments(
    meetingId,
    'Who owns the action item?',
);
const followupAnswer = await generateRagAnswer({
    question: 'Who owns it?',
    documents: followupDocuments,
    history: [
        {
            role: 'user',
            content: 'When is the action item due?',
        },
        {
            role: 'assistant',
            content: 'It is due on Saturday.',
        },
    ],
});

assert.match(followupAnswer.answer, /Speaker\s*1/i);

console.log(
    JSON.stringify(
        {
            answer: answer.answer,
            citationCount: answer.citations.length,
            citations: answer.citations,
            absentState: absentAnswer.state,
            followupAnswer: followupAnswer.answer,
        },
        null,
        2,
    ),
);
