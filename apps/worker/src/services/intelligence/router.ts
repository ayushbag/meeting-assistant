import type { MeetingClassification } from './classifier.js';
import { businessPrompt } from './prompts/business/v1.js';
import { genericPrompt } from './prompts/generic/v1.js';
import { businessIntelligenceSchema } from './schemas/business.js';
import { genericIntelligenceSchema } from './schemas/generic.js';

export type IntelligencePipeline = {
    meetingType: MeetingClassification['meetingType'];

    schema: 
        | typeof genericIntelligenceSchema
        | typeof businessIntelligenceSchema;

    prompt: (transcript: string) => string;
};

export const routeMeeting = (classification: MeetingClassification): IntelligencePipeline => {
    switch (classification.meetingType) {
        case 'business':
            return {
                meetingType: 'business',
                schema: businessIntelligenceSchema,
                prompt: businessPrompt,
            };

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
