import { classifyMeeting } from './classifier.js';
import { extractIntelligence } from './extractor.js';
import { routeMeeting } from './router.js';

// type: other
const transcript = `
Speaker 1: Hey, are you coming to Pune this weekend?

Speaker 2: I think so. I'm planning to come on Saturday morning.

Speaker 1: Nice. We could go out for lunch.

Speaker 2: Sure. Do you know any good places around FC Road?

Speaker 1: There is a new cafe I wanted to try.

Speaker 2: Sounds good. What time should we meet?

Speaker 1: Maybe around one?

Speaker 2: Yeah, one works for me.

Speaker 1: Perfect. I'll message you the location on Saturday.

Speaker 2: Cool. See you then.
`;

const classification = await classifyMeeting(transcript);

console.log('Classification');
console.dir(classification, { depth: null });

const pipeline = routeMeeting(classification);

console.log('\nPipeline:');
console.log(pipeline.meetingType);

const intelligence = await extractIntelligence(transcript, pipeline);

console.log('\nExtracted intelligence:');
console.dir(intelligence, { depth: null });
