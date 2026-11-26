export type RagSourceType =
    | 'goal'
    | 'key_topic'
    | 'important_moment'
    | 'outcome'
    | 'action_item'
    | 'decision'
    | 'discussion_point'
    | 'risk'
    | 'open_question'
    | 'transcript';

export interface RagDocument {
    id: string;
    meetingId: string;
    sourceType: RagSourceType;
    content: string;
    metadata: Record<string, unknown>;
}

export interface TranscriptChunk {
    id: string;
    meetingId: string;
    sourceType: 'transcript';
    content: string;
    metadata: {
        chunkIndex: number;
        startSpeaker?: string;
        endSpeaker?: string;
    };
}

export interface RetrievedDocument {
    document: RagDocument;
    score: number;
}

export interface RetrieveOptions {
    limit?: number;
    scoreThreshold?: number;
}

export interface RagConversationTurn {
    role: 'user' | 'assistant';
    content: string;
}

export interface RagCitation {
    documentId: string;
    sourceType: RagSourceType;
    meetingId: string;
    quote: string;
}

export type RagAnswerState = 'answered' | 'no-answer';

export interface RagAnswerResponse {
    state: RagAnswerState;
    answer: string;
    citations: RagCitation[];
}
