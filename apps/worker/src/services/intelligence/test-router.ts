import { routeMeeting } from './router.js';

const result = routeMeeting({
    meetingType: 'other',
    confidence: 0.7,
    goal: 'General discussion',
    language: 'en',
});

console.dir(result, { depth: null });
