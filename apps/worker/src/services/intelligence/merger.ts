import { ai } from '../../config/ai.config.js';
import type { IntelligencePipeline, IntelligenceResult } from './router.js';

export type SegmentIntelligence = {
    segmentIndex: number;
    intelligence: IntelligenceResult;
};

type DedupeItem = {
    evidence?: { verified?: boolean };
    owner?: string;
    deadline?: string;
};

const normalizeDedupeText = (text: string | undefined): string =>
    (text ?? '')
        .toLowerCase()
        .replace(/['’]/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

const isVerified = (item: DedupeItem): boolean =>
    item.evidence?.verified === true;

const dedupeBy = <T extends DedupeItem>(
    items: T[] | undefined,
    getText: (item: T) => string | undefined,
): T[] | undefined => {
    if (!items) {
        return items;
    }

    const byKey = new Map<string, T>();

    for (const item of items) {
        const key = [
            normalizeDedupeText(getText(item)),
            normalizeDedupeText(item.owner),
            normalizeDedupeText(item.deadline),
        ].join('\u0000');

        const existing = byKey.get(key);

        if (!existing || (isVerified(item) && !isVerified(existing))) {
            byKey.set(key, item);
        }
    }

    return [...byKey.values()];
};

export const dedupeIntelligence = (
    segmentResults: SegmentIntelligence[],
): SegmentIntelligence[] => {
    return segmentResults.map((result) => {
        const decisions = dedupeBy(
            result.intelligence.decisions,
            (item) => item.decision,
        );

        return {
            ...result,
            intelligence: {
                ...result.intelligence,
                actionItems:
                    dedupeBy(
                        result.intelligence.actionItems,
                        (item) => item.task,
                    ) ?? [],
                ...(decisions ? { decisions } : {}),
            },
        };
    });
};

export const mergeIntelligence = async (
    segmentResults: SegmentIntelligence[],
    pipeline: IntelligencePipeline,
): Promise<IntelligenceResult> => {
    const preparedResults = dedupeIntelligence(segmentResults);

    const prompt = `
You are the intelligence merger component of MeetingLens.

Your job is to merge intelligence extracted from multiple transcript segments
into one coherent meeting-level intelligence result.

Rules:

1. Combine duplicate or overlapping information.
2. Do not invent information.
3. Preserve important details from the segment results.
4. Preserve evidence quotes verbatim when they exist.
5. sourceSegment MUST be copied exactly from the provided extracted segment intelligence.
6. NEVER invent, change, or guess a sourceSegment.
7. Merge participants that clearly refer to the same person.
8. Merge duplicate topics, outcomes, questions, and action items.
9. Do not lose unique information just because it appears in only one segment.
10. Keep action item owners and deadlines when available.
11. When action items or decisions duplicate each other, keep one copy.
12. Prefer the duplicate whose evidence is marked verified.
13. Return only information supported by the extracted segment intelligence.
14. Output must match the provided schema.

Extracted segment intelligence:

---
${JSON.stringify(preparedResults, null, 2)}
---
`.trim();

    const response = await ai.text.generateStructured({
        prompt,
        jsonSchema: pipeline.schema.toJSONSchema(),
    });

    const parsed = JSON.parse(response.text);
    const merged = pipeline.schema.parse(parsed) as IntelligenceResult;

    return dedupeIntelligence([
        { segmentIndex: 0, intelligence: merged },
    ])[0]!.intelligence;
};
