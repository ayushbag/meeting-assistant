import { readFile } from 'node:fs/promises';

import { GoogleGenAI } from '@google/genai';
import {
    SpeechToTextConfig,
    SpeechToTextProvider,
    TranscribeRequest,
    TranscribeResponse,
} from '../types.js';

const TRANSCRIBE_PROMPT = `
You are a professional transcription service. Transcribe the provided audio verbatim.
- Preserve the original wording exactly. Do not summarize, paraphrase, or clean up speech.
- Label speaker turns as "Speaker 1", "Speaker 2", etc. when distinguishable.
- Prefix each speaker turn with a [MM:SS] timestamp.
- Mark unintelligible audio as [inaudible].
- ALWAYS transcribe in the Latin alphabet (romanized script). For Hindi and any other
  Indic languages, write the words in romanized Latin script exactly as they sound
  (e.g. "Namaste, aap kaise hain?"). NEVER use Devanagari or any other native script.
`.trim();

export const createGeminiSpeechProvider = (config: SpeechToTextConfig): SpeechToTextProvider => {
    const client = new GoogleGenAI({
        apiKey: config.apiKey,
    });

    return {
        async transcribe(request: TranscribeRequest): Promise<TranscribeResponse> {
            const bytes = await readFile(request.audioPath);
            const arrayBuffer = bytes.buffer.slice(
                bytes.byteOffset,
                bytes.byteOffset + bytes.byteLength,
            ) as ArrayBuffer;

            const start = await fetch(
                `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${config.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Upload-Protocol': 'resumable',
                        'X-Goog-Upload-Command': 'start',
                        'X-Goog-Upload-Header-Content-Length': String(bytes.length),
                        'X-Goog-Upload-Header-Content-Type': request.mimeType,
                        'X-Goog-Upload-File-Name': 'audio.wav',
                    },
                    body: JSON.stringify({
                        file: {
                            mimeType: request.mimeType,
                            sizeBytes: String(bytes.length),
                        },
                    }),
                },
            );

            if (!start.ok) {
                throw new Error(`Gemini upload start failed: ${await start.text()}`);
            }

            const uploadUrl = start.headers.get('x-goog-upload-url');
            if (!uploadUrl) {
                throw new Error('Gemini upload URL missing from response');
            }

            const uploaded = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': request.mimeType,
                    'X-Goog-Upload-Command': 'upload, finalize',
                    'X-Goog-Upload-Offset': '0',
                },
                body: arrayBuffer,
            });

            if (!uploaded.ok) {
                throw new Error(`Gemini upload failed: ${await uploaded.text()}`);
            }

            const { file } = (await uploaded.json()) as {
                file?: { uri?: string; name?: string; mimeType?: string };
            };
            if (!file?.uri) {
                throw new Error('Gemini upload response missing file URI');
            }

            try {
                const response = await client.models.generateContent({
                    model: config.model,
                    contents: {
                        role: 'user',
                        parts: [
                            { text: TRANSCRIBE_PROMPT },
                            {
                                fileData: {
                                    fileUri: file.uri,
                                    mimeType: file.mimeType ?? request.mimeType,
                                },
                            },
                        ],
                    },
                });

                return {
                    text: response.text ?? '',
                };
            } finally {
                // Deletion is best-effort: never mask the transcription error.
                if (file.name) {
                    await client.files.delete({ name: file.name }).catch(() => {});
                }
            }
        },
    };
};
