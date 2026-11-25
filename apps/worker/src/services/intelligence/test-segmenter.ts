import assert from 'node:assert/strict';

import { dedupeIntelligence } from './merger.js';
import type { IntelligenceResult } from './router.js';
import { segmentTranscript } from './segmenter.js';

const quote = "let's target September 15th for the launch";

const transcript = [
    `Speaker 1: Before we close the planning discussion and before anyone leaves the call today, ${quote} because QA needs two more days after the staging review.`,
    'Speaker 2: I will send the finalized checklist to the team tomorrow morning.',
].join('\n');

const segments = segmentTranscript(transcript, 120, { overlapChars: 60 });

assert.ok(segments.length > 1, 'oversized line should be split');
assert.ok(
    segments.every((segment) => segment.text.length <= 120),
    'segments must respect the character budget',
);
assert.ok(
    !segments[0]!.text.includes(quote),
    'fixture quote must cross a segment boundary',
);
assert.ok(
    segments.some((segment) => segment.text.includes(quote)),
    'cross-boundary decision quote must survive in one segment',
);

const emptyIntelligence = {
    keyTopics: [],
    participants: [],
    importantMoments: [],
    openQuestions: [],
    outcomes: [],
    actionItems: [],
};

const makeIntelligence = (
    actionItems: IntelligenceResult['actionItems'],
    decisions: IntelligenceResult['decisions'] = [],
): IntelligenceResult => ({
    ...emptyIntelligence,
    actionItems,
    decisions,
    discussionPoints: [],
    risks: [],
});

const deduped = dedupeIntelligence([
    {
        segmentIndex: 1,
        intelligence: makeIntelligence([
            {
                task: 'Send the report',
                owner: 'Asha',
                deadline: 'Friday',
                evidence: { quote: 'I will send the report.', sourceSegment: 1 },
            },
        ], [
            {
                decision: 'Ship on Friday',
                owner: 'Asha',
                evidence: { quote: 'We will ship on Friday.', sourceSegment: 1 },
            },
        ]),
    },
    {
        segmentIndex: 2,
        intelligence: makeIntelligence([
            {
                task: 'send   the REPORT',
                owner: 'asha',
                deadline: 'friday',
                evidence: {
                    quote: 'I will send the report by Friday.',
                    sourceSegment: 2,
                    verified: true,
                },
            },
        ], [
            {
                decision: 'ship on friday',
                owner: 'asha',
                evidence: {
                    quote: 'We will ship on Friday.',
                    sourceSegment: 2,
                    verified: true,
                },
            },
        ]),
    },
]);

const mergedResult = deduped[1]!;

assert.equal(mergedResult.intelligence.actionItems.length, 1);
assert.equal(
    mergedResult.intelligence.actionItems[0]?.evidence?.verified,
    true,
);
assert.equal(mergedResult.intelligence.decisions?.length, 1);
assert.equal(
    mergedResult.intelligence.decisions?.[0]?.evidence?.verified,
    true,
);

console.dir(segments, { depth: null });
console.log('\nSegmenter and dedupe assertions passed ✅\n');
