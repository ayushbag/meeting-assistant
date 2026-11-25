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
): number | null => {
    const normalizedQuote = normalizeText(quote);

    return (
        segments.find((segment) =>
            normalizeText(segment.text).includes(normalizedQuote),
        )?.index ?? null
    );
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
            const sourceSegment = findSourceSegment(evidence.quote, segments);

            if (sourceSegment === null) {
                evidence.verified = false;
                delete evidence.sourceSegment;
            } else {
                evidence.sourceSegment = sourceSegment;
                evidence.verified = true;
            }
        }
    }

    for (const child of Object.values(object)) {
        verifyEvidenceRecursive(child, segments);
    }
};

export const verifyEvidence = <T extends CommonIntelligence>(
    intelligence: T,
    segments: TranscriptSegment[],
): T => {
    verifyEvidenceRecursive(intelligence, segments);

    return intelligence;
};
