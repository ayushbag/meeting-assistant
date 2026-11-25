import type { MeetingClassification } from './classifier.js';
import { routeMeeting } from './router.js';

const fixtures: MeetingClassification[] = [
    { meetingType: 'business', confidence: 0.8, goal: 'Project planning', language: 'en' },
    { meetingType: 'business', confidence: 0.4, goal: 'Project planning', language: 'en' },
    { meetingType: 'other', confidence: 0.9, goal: 'General discussion', language: 'en' },
    { meetingType: 'lecture', confidence: 0.9, goal: 'Teaching session', language: 'en' },
    { meetingType: 'sales', confidence: 0.9, goal: 'Sales call', language: 'en' },
    { meetingType: 'interview', confidence: 0.9, goal: 'Candidate evaluation', language: 'en' },
    { meetingType: 'standup', confidence: 0.9, goal: 'Status update', language: 'en' },
    { meetingType: 'brainstorm', confidence: 0.9, goal: 'Idea generation', language: 'en' },
    { meetingType: 'review', confidence: 0.9, goal: 'Deliverable review', language: 'en' },
];

for (const fixture of fixtures) {
    const pipeline = routeMeeting(fixture);
    const expected =
        fixture.meetingType === 'business' && fixture.confidence >= 0.6
            ? 'business'
            : 'other';

    if (pipeline.meetingType !== expected) {
        throw new Error(
            `${fixture.meetingType}/${fixture.confidence} routed to ${pipeline.meetingType}`,
        );
    }

    console.log(`${fixture.meetingType}/${fixture.confidence} -> ${pipeline.meetingType}`);
}
