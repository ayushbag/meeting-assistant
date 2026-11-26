import type { RagDocument, RagSourceType } from '@repo/rag';

interface Evidence {
    sourceSegment?: number;
    quote?: string;
}

interface ImportantMoment {
    summary: string;
    evidence?: Evidence;
}

interface ActionItem {
    task: string;
    owner?: string;
    deadline?: string;
    importance?: string;
    evidence?: Evidence;
}

interface Decision {
    decision: string;
    evidence?: Evidence;
}

interface DiscussionPoint {
    topic: string;
    summary: string;
    evidence?: Evidence;
}

interface Risk {
    risk: string;
    impact?: string;
    evidence?: Evidence;
}

export interface MeetingIntelligencePayload {
    classification?: {
        goal?: string;
    };

    intelligence?: {
        keyTopics?: string[];
        importantMoments?: ImportantMoment[];
        openQuestions?: string[];
        outcomes?: string[];
        actionItems?: ActionItem[];
        decisions?: Decision[];
        discussionPoints?: DiscussionPoint[];
        risks?: Risk[];
    };
}

function createId(meetingId: string, sourceType: RagSourceType, index: number): string {
    return `${meetingId}:${sourceType}:${index}`;
}

function evidenceMetadata(evidence?: Evidence): Record<string, unknown> {
    if (!evidence) {
        return {};
    }

    return {
        sourceSegment: evidence.sourceSegment,
        quote: evidence.quote,
    };
}

function sourceMetadata(
    quote: string,
    evidence?: Evidence,
): Record<string, unknown> {
    return {
        ...evidenceMetadata(evidence),
        quote: evidence?.quote ?? quote,
    };
}

export function buildRagDocuments(
    meetingId: string,
    payload: MeetingIntelligencePayload,
): RagDocument[] {
    const documents: RagDocument[] = [];

    const intelligence = payload.intelligence;

    if (!intelligence) {
        return documents;
    }

    if (payload.classification?.goal) {
        documents.push({
            id: createId(meetingId, 'goal', 0),
            meetingId,
            sourceType: 'goal',
            content: `Meeting goal: ${payload.classification.goal}`,
            metadata: sourceMetadata(`Meeting goal: ${payload.classification.goal}`),
        });
    }

    intelligence.keyTopics?.forEach((topic, index) => {
        documents.push({
            id: createId(meetingId, 'key_topic', index),
            meetingId,
            sourceType: 'key_topic',
            content: `Key topic: ${topic}`,
            metadata: sourceMetadata(`Key topic: ${topic}`),
        });
    });

    intelligence.importantMoments?.forEach((moment, index) => {
        documents.push({
            id: createId(meetingId, 'important_moment', index),
            meetingId,
            sourceType: 'important_moment',
            content: [
                `Important moment: ${moment.summary}`,
                moment.evidence?.quote
                    ? `Evidence: "${moment.evidence.quote}"`
                    : undefined,
            ]
                .filter(Boolean)
                .join('\n'),
            metadata: sourceMetadata(
                `Important moment: ${moment.summary}`,
                moment.evidence,
            ),
        });
    });

    intelligence.outcomes?.forEach((outcome, index) => {
        documents.push({
            id: createId(meetingId, 'outcome', index),
            meetingId,
            sourceType: 'outcome',
            content: `Meeting outcome: ${outcome}`,
            metadata: sourceMetadata(`Meeting outcome: ${outcome}`),
        });
    });

    intelligence.actionItems?.forEach((item, index) => {
        documents.push({
            id: createId(meetingId, 'action_item', index),
            meetingId,
            sourceType: 'action_item',
            content: [
                `Action item: ${item.task}`,
                item.owner ? `Owner: ${item.owner}` : undefined,
                item.deadline ? `Deadline: ${item.deadline}` : undefined,
                item.importance ? `Importance: ${item.importance}` : undefined,
                item.evidence?.quote
                    ? `Evidence: "${item.evidence.quote}"`
                    : undefined,
            ]
                .filter(Boolean)
                .join('\n'),
            metadata: {
                ...sourceMetadata(`Action item: ${item.task}`, item.evidence),
                owner: item.owner,
                deadline: item.deadline,
                importance: item.importance,
            },
        });
    });

    intelligence.decisions?.forEach((decision, index) => {
        documents.push({
            id: createId(meetingId, 'decision', index),
            meetingId,
            sourceType: 'decision',
            content: [
                `Decision: ${decision.decision}`,
                decision.evidence?.quote
                    ? `Evidence: "${decision.evidence.quote}"`
                    : undefined,
            ]
                .filter(Boolean)
                .join('\n'),
            metadata: sourceMetadata(
                `Decision: ${decision.decision}`,
                decision.evidence,
            ),
        });
    });

    intelligence.discussionPoints?.forEach((point, index) => {
        documents.push({
            id: createId(meetingId, 'discussion_point', index),
            meetingId,
            sourceType: 'discussion_point',
            content: [
                `Discussion topic: ${point.topic}`,
                `Summary: ${point.summary}`,
                point.evidence?.quote
                    ? `Evidence: "${point.evidence.quote}"`
                    : undefined,
            ]
                .filter(Boolean)
                .join('\n'),
            metadata: sourceMetadata(
                `Discussion topic: ${point.topic}`,
                point.evidence,
            ),
        });
    });

    intelligence.risks?.forEach((risk, index) => {
        documents.push({
            id: createId(meetingId, 'risk', index),
            meetingId,
            sourceType: 'risk',
            content: [
                `Risk: ${risk.risk}`,
                risk.impact ? `Impact: ${risk.impact}` : undefined,
                risk.evidence?.quote
                    ? `Evidence: "${risk.evidence.quote}"`
                    : undefined,
            ]
                .filter(Boolean)
                .join('\n'),
            metadata: sourceMetadata(`Risk: ${risk.risk}`, risk.evidence),
        });
    });

    intelligence.openQuestions?.forEach((question, index) => {
        documents.push({
            id: createId(meetingId, 'open_question', index),
            meetingId,
            sourceType: 'open_question',
            content: `Open question: ${question}`,
            metadata: sourceMetadata(`Open question: ${question}`),
        });
    });

    return documents;
}