import { logger } from '@repo/logger';

import type { MeetingClassification } from './classifier.js';
import { businessPrompt } from './prompts/business/v1.js';
import { genericPrompt } from './prompts/generic/v1.js';
import { businessIntelligenceSchema } from './schemas/business.js';
import { genericIntelligenceSchema } from './schemas/generic.js';

const BUSINESS_CONFIDENCE_THRESHOLD = 0.6;

export type IntelligencePipeline = {
    meetingType: 'business' | 'other';

    schema: 
        | typeof genericIntelligenceSchema
        | typeof businessIntelligenceSchema;

    prompt: (transcript: string) => string;
};

const genericPipeline = (
    classification: MeetingClassification,
    reason: string,
): IntelligencePipeline => {
    logger.info(
        {
            classifiedAs: classification.meetingType,
            confidence: classification.confidence,
            reason,
        },
        'Falling back to generic intelligence pipeline',
    );

    return {
        meetingType: 'other',
        schema: genericIntelligenceSchema,
        prompt: genericPrompt,
    };
};

export const routeMeeting = (classification: MeetingClassification): IntelligencePipeline => {
    if (classification.meetingType === 'business') {
        if (classification.confidence >= BUSINESS_CONFIDENCE_THRESHOLD) {
            return {
                meetingType: 'business',
                schema: businessIntelligenceSchema,
                prompt: businessPrompt,
            };
        }

        return genericPipeline(classification, 'business confidence below threshold');
    }

    if (classification.meetingType === 'other') {
        return genericPipeline(classification, 'classified as other');
    }

    return genericPipeline(classification, 'meeting type outside business scope');
};
