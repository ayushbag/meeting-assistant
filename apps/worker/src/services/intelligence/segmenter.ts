export interface TranscriptSegment {
    index: number;
    text: string;
}

export interface SegmentOptions {
    overlapChars?: number;
    maxTokens?: number;
}

type SegmentUnit = {
    text: string;
    continuesPreviousLine: boolean;
};

const DEFAULT_MAX_CHARS = 120_000;
const DEFAULT_MAX_TOKENS = 20_000;
const APPROX_CHARS_PER_TOKEN = 4;
const DEFAULT_OVERLAP_CHARS = 800;

const splitOversizedLine = (line: string, budget: number): string[] => {
    const chunks: string[] = [];

    let start = 0;

    while (start < line.length) {
        let end = Math.min(start + budget, line.length);

        if (end < line.length) {
            const minimumEnd = start + Math.floor(budget / 2);
            const whitespace = line.lastIndexOf(' ', end);

            if (whitespace >= minimumEnd) {
                end = whitespace;
            }
        }

        chunks.push(line.slice(start, end));
        start = end;
    }

    return chunks;
};

export const segmentTranscript = (
    transcript: string,
    maxChars: number = DEFAULT_MAX_CHARS,
    options: SegmentOptions = {},
): TranscriptSegment[] => {
    if (!transcript.trim()) {
        return [];
    }

    if (!Number.isFinite(maxChars) || maxChars <= 0) {
        throw new Error('maxChars must be greater than 0');
    }

    const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    const overlapChars = options.overlapChars ?? DEFAULT_OVERLAP_CHARS;

    if (!Number.isFinite(maxTokens) || maxTokens <= 0) {
        throw new Error('maxTokens must be greater than 0');
    }

    if (!Number.isFinite(overlapChars) || overlapChars < 0) {
        throw new Error('overlapChars must be zero or greater');
    }

    const tokenBudget = Math.floor(maxTokens) * APPROX_CHARS_PER_TOKEN;
    const budget = Math.max(1, Math.min(Math.floor(maxChars), tokenBudget));
    const overlap = Math.min(
        Math.floor(overlapChars),
        Math.floor(budget * 0.25),
    );

    const units: SegmentUnit[] = transcript
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .flatMap((line) => {
            if (line.length <= budget) {
                return [{ text: line, continuesPreviousLine: false }];
            }

            return splitOversizedLine(line, budget).map((text, index) => ({
                text,
                continuesPreviousLine: index > 0,
            }));
        });

    const segments: TranscriptSegment[] = [];

    let currentText = '';

    const flush = () => {
        if (!currentText) {
            return;
        }

        segments.push({
            index: segments.length + 1,
            text: currentText,
        });

        currentText = '';
    };

    for (const unit of units) {
        const separator = currentText && !unit.continuesPreviousLine ? '\n' : '';

        if (currentText && currentText.length + separator.length + unit.text.length > budget) {
            const previousText = currentText;

            flush();

            const availableOverlap = Math.max(
                0,
                budget - unit.text.length - separator.length,
            );
            const overlapLength = Math.min(overlap, availableOverlap);

            if (overlapLength > 0) {
                currentText = previousText.slice(-overlapLength);
            }
        }

        const nextSeparator =
            currentText && !unit.continuesPreviousLine ? '\n' : '';

        currentText += nextSeparator + unit.text;
    }

    flush();

    return segments;
};
