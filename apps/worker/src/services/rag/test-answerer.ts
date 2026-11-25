import { generateRagAnswer } from './answerer.js';
import { retrieveDocuments } from './retriever.js';

const meetingId = 'cmvhpxaq70000jktund6d33fj';

const question =
    'What problems were identified during the meeting, and what actions were agreed upon to address them?';

const documents = await retrieveDocuments(
    meetingId,
    question,
);

const answer = await generateRagAnswer({
    question,
    documents,
});

console.log('\nQuestion:', question);
console.log('\nAnswer:', answer);