import type { MeetingClassification } from './classifier.js';
import { genericPrompt } from './prompts/generic/v1.js';
import { genericIntelligenceSchema } from './schemas/generic.js';

export type IntelligencePipeline = {
    meetingType: MeetingClassification['meetingType'];
    schema: typeof genericIntelligenceSchema;
    prompt: (transcript: string) => string;
};

export const routeMeeting = (classification: MeetingClassification): IntelligencePipeline => {
    switch (classification.meetingType) {
        case 'other':
            return {
                meetingType: 'other',
                schema: genericIntelligenceSchema,
                prompt: genericPrompt,
            };

        default:
            throw new Error(
                `No intelligence pipeline implemented for meeting type: ${classification.meetingType}`,
            );
    }
};
