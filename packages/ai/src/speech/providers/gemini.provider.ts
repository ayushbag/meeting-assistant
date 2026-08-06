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
`.trim();

export const createGeminiSpeechProvider = (config: SpeechToTextConfig): SpeechToTextProvider => {
    const client = new GoogleGenAI({
        apiKey: config.apiKey,
    });

    return {
        async transcribe(request: TranscribeRequest): Promise<TranscribeResponse> {
            const file = await client.files.upload({
                file: request.audioPath,
                config: {
                    mimeType: request.mimeType,
                },
            });

            console.log('Uploaded:', file);

            try {
                console.log('Generating transcript...');

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
            } catch(err) {
                console.dir(err, { depth: null })
                throw err;
            } finally {
                // Clean up the uploaded file from Gemini storage.
                // Deletion is best-effort: never mask the transcription error.
                if (file.name) {
                    await client.files.delete({ name: file.name }).catch(() => {});
                }
            }
        },
    };
};
