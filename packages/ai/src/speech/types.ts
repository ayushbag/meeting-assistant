export type SpeechToTextProviderType = 'gemini' | 'deepgram';

export interface SpeechToTextConfig {
    provider: SpeechToTextProviderType;
    apiKey?: string;
    model: string;
}

export interface TranscribeRequest {
    audioPath: string;
    mimeType: string;
}

export interface TranscribeResponse {
    text: string;
}

export interface SpeechToTextProvider {
    transcribe(request: TranscribeRequest): Promise<TranscribeResponse>;
}
