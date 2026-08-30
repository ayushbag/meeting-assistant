import type { CommonIntelligence } from './schemas/common.js';
import type { TranscriptSegment } from './segmenter.js';

const normalizeText = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/['’]/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
};

const findSourceSegment = (
    quote: string,
    segments: TranscriptSegment[],
): number => {
    const normalizedQuote = normalizeText(quote);

    const matchingSegment = segments.find((segment) =>
        normalizeText(segment.text).includes(normalizedQuote),
    );

    if (!matchingSegment) {
        throw new Error(
            `Evidence quote not found in transcript: "${quote}"`,
        );
    }

    return matchingSegment.index;
};

export const verifyEvidence = (
    intelligence: CommonIntelligence,
    segments: TranscriptSegment[],
): CommonIntelligence => {
    for (const moment of intelligence.importantMoments) {
        if (!moment.evidence) {
            continue;
        }

        moment.evidence.sourceSegment = findSourceSegment(
            moment.evidence.quote,
            segments,
        );
    }

    for (const actionItem of intelligence.actionItems) {
        if (!actionItem.evidence) {
            continue;
        }

        actionItem.evidence.sourceSegment = findSourceSegment(
            actionItem.evidence.quote,
            segments,
        );
    }

    return intelligence;
};