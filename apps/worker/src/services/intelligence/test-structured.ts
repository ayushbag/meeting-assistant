import { ai } from '../../config/ai.config.js';

const schema = {
    type: 'object',
    properties: {
        meetingType: {
            type: 'string',
            enum: ['business', 'lecture', 'other'],
        },
        goal: {
            type: 'string',
        },
        confidence: {
            type: 'number',
        },
    },
    required: ['meetingType', 'goal', 'confidence'],
};

const response = await ai.text.generateStructured({
    model: process.env.GEMINI_CLASSIFY_MODEL!,
    prompt: `
Classify this meeting:

"We need to decide whether to launch the new product this quarter.
The engineering team says development will take three weeks.
The product manager wants to launch by September."

Return the meeting type, goal and confidence.
    `,
    jsonSchema: schema,
});


console.log(response.text);