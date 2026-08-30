import { persistSummary } from './persist.js';
import { generateMeetingSummary } from './summarizer.js';

const transcript = `
Speaker 1: Are you coming to Pune on Saturday?
Speaker 2: I think so. I'm planning to come on Saturday morning.
Speaker 1: Great. Want to meet for lunch?
Speaker 2: Sure.
Speaker 1: How about one?
Speaker 2: Yeah, one works for me.
Speaker 1: I'll message you the location on Saturday.
`;

const summary = await generateMeetingSummary(transcript);

console.log('\n===== SUMMARY =====\n');
console.log(summary);

await persistSummary('cmtflfv77000178tubw77m0in', summary);

console.log('\nAdded summary to DB ✅\n');
