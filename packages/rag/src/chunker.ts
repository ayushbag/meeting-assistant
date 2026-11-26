import type { TranscriptChunk } from './types.js';

interface TranscriptLine {
    speaker: string;
    text: string;
}

const MAX_CHARS = 3000;

function parseTranscript(transcript: string): TranscriptLine[] {
    return transcript
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const match = line.match(/^([^:]+):\s*(.+)$/);

            if (!match) {
                return {
                    speaker: 'Unknown',
                    text: line,
                };
            }

            const speaker = match[1];
            const text = match[2];

            if (!speaker || !text) {
                return {
                    speaker: 'Unknown',
                    text: line,
                };
            }

            return {
                speaker: speaker.trim(),
                text: text.trim(),
            };
        });
}

export function chunkTranscript(
    meetingId: string,
    transcript: string,
): TranscriptChunk[] {
    const lines = parseTranscript(transcript);

    const chunks: TranscriptChunk[] = [];
    let currentLines: TranscriptLine[] = [];
    let currentLength = 0;

    const flush = () => {
        if (currentLines.length === 0) {
            return;
        }

        const chunkIndex = chunks.length;

        chunks.push({
            id: `${meetingId}:transcript:${chunkIndex}`,
            meetingId,
            sourceType: 'transcript',
            content: currentLines
                .map((line) => `${line.speaker}: ${line.text}`)
                .join('\n'),
            metadata: {
                chunkIndex,
                startSpeaker: currentLines[0]?.speaker,
                endSpeaker: currentLines[currentLines.length - 1]?.speaker,
            },
        });

        currentLines = [];
        currentLength = 0;
    };

    for (const line of lines) {
        const formattedLine = `${line.speaker}: ${line.text}`;

        if (
            currentLines.length > 0 &&
            currentLength + formattedLine.length > MAX_CHARS
        ) {
            flush();
        }

        currentLines.push(line);
        currentLength += formattedLine.length + 1;
    }

    flush();

    return chunks;
}
