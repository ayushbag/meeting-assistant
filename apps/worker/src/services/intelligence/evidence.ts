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

const verifyEvidenceRecursive = (
    value: unknown,
    segments: TranscriptSegment[],
): void => {
    if (!value || typeof value !== 'object') {
        return;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            verifyEvidenceRecursive(item, segments);
        }
        return;
    }

    const object = value as Record<string, unknown>;

    if (
        object.evidence &&
        typeof object.evidence === 'object' &&
        !Array.isArray(object.evidence)
    ) {
        const evidence = object.evidence as Record<string, unknown>;

        if (typeof evidence.quote === 'string') {
            evidence.sourceSegment = findSourceSegment(
                evidence.quote,
                segments,
            );
        }
    }

    for (const child of Object.values(object)) {
        verifyEvidenceRecursive(child, segments);
    }
};

export const verifyEvidence = (
    intelligence: CommonIntelligence,
    segments: TranscriptSegment[],
): CommonIntelligence => {
    verifyEvidenceRecursive(intelligence, segments);

    return intelligence;
};