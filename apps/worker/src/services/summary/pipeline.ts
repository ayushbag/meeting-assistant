import { logger } from '@repo/logger';

import { env } from '../../config/app.config.js';
import { persistSummary } from './persist.js';
import { generateMeetingSummary, summaryPromptVersion } from './summarizer.js';

export const runSummaryPipeline = async (transcript: string, meetingId: string) => {
    const markdown = await generateMeetingSummary(transcript);

    await persistSummary(meetingId, markdown, {
        promptVersion: summaryPromptVersion,
        model: env.GEMINI_MODEL,
    });

    logger.info({ meetingId }, 'Summary persisted');

    return markdown;
};
