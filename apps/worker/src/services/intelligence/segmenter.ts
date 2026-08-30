export interface TranscriptSegment {
    index: number;
    text: string;
}

const DEFAULT_MAX_CHARS = 120_000;

export const segmentTranscript = (
    transcript: string,
    maxChars: number = DEFAULT_MAX_CHARS,
): TranscriptSegment[] => {
    if (!transcript.trim()) {
        return [];
    }

    if (maxChars <= 0) {
        throw new Error('maxChars must be greater than 0');
    }

    const lines = transcript
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    const segments: TranscriptSegment[] = [];

    let currentLines: string[] = [];
    let currentLength = 0;

    const flush = () => {
        if (currentLines.length === 0) {
            return;
        }

        segments.push({
            index: segments.length + 1,
            text: currentLines.join('\n'),
        });

        currentLines = [];
        currentLength = 0;
    };

    for (const line of lines) {
        const lineLength = line.length;

        // A single line larger than the limit becomes its own segment.
        if (lineLength > maxChars) {
            flush();

            segments.push({
                index: segments.length + 1,
                text: line,
            });

            continue;
        }

        const separatorLength = currentLines.length > 0 ? 1 : 0;

        if (currentLength + separatorLength + lineLength > maxChars) {
            flush();
        }

        currentLines.push(line);

        currentLength += (currentLines.length > 1 ? 1 : 0) + lineLength;
    }

    flush();

    return segments;
};
