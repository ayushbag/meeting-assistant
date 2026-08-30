import { ai } from "../../config/ai.config.js";
import type { IntelligencePipeline } from "./router.js";
import type { GenericIntelligence } from './schemas/generic.js';

type SegmentIntelligence = {
    segmentIndex: number;
    intelligence: GenericIntelligence;
};

export const mergeIntelligence = async (
    segmentResults: SegmentIntelligence[],
    pipeline: IntelligencePipeline,
) => {
    const prompt = `
You are the intelligence merger component of MeetingLens.

Your job is to merge intelligence extracted from multiple transcript segments
into one coherent meeting-level intelligence result.

Rules:

1. Combine duplicate or overlapping information.
2. Do not invent information.
3. Preserve important details from the segment results.
4. Preserve evidence quotes when they exist.
5. sourceSegment MUST be copied exactly from the provided extracted segment intelligence.
6. NEVER invent, change, or guess a sourceSegment.
7. Merge participants that clearly refer to the same person.
8. Merge duplicate topics, outcomes, questions, and action items.
9. Do not lose unique information just because it appears in only one segment.
10. Keep action item owners and deadlines when available.
11. Return only information supported by the extracted segment intelligence.
12. Output must match the provided schema.

Extracted segment intelligence:

---
${JSON.stringify(segmentResults, null, 2)}
---
`.trim();

    const response = await ai.text.generateStructured({
        prompt,
        jsonSchema: pipeline.schema.toJSONSchema(),
    })

    const parsed = JSON.parse(response.text);

    return pipeline.schema.parse(parsed);
}