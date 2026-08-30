import { ai } from '../../config/ai.config.js';
import { IntelligencePipeline } from './router.js';
import { validateIntelligence } from './validation.js';

const MAX_RETRIES = 1;

export const extractIntelligence = async (transcript: string, pipeline: IntelligencePipeline) => {
    const basePrompt = pipeline.prompt(transcript);

    let prompt = basePrompt;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const response = await ai.text.generateStructured({
            prompt,
            jsonSchema: pipeline.schema.toJSONSchema(),
        });

        const parsed = JSON.parse(response.text);

        const validation = validateIntelligence(parsed, pipeline);

        if (validation.success) {
            console.log('Validation successful');
            return validation.data;
        }

        console.log('Validation failed:', validation.error.message);

        if (attempt === MAX_RETRIES) {
            throw new Error(
                `Intelligence validation failed after ${MAX_RETRIES + 1} attempts: ${validation.error.message}`,
            );
        }

        prompt = `
            ${basePrompt}

            The previous response failed schema validation.

            Validation errors:
            ${validation.error.message}

            Return a corrected response that strictly follows the required schema.
            Do not add explanations.
            `.trim();
    }

    throw new Error('Intelligence extraction failed unexpectedly');
};
