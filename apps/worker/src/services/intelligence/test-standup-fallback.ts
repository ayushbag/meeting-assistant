import assert from "node:assert/strict";

import type { MeetingClassification } from "./classifier.js";
import { routeMeeting } from "./router.js";
import { genericPromptVersion } from "./prompts/generic/v1.js";
import { genericIntelligenceSchema } from "./schemas/generic.js";

const transcript = `
Speaker 1: Quick standup. Yesterday I finished the billing fix.
Speaker 2: Today I am reviewing the deploy checklist.
Speaker 1: Any blockers?
Speaker 2: No blockers from my side.
`;

const classification: MeetingClassification = {
    meetingType: "standup",
    confidence: 0.9,
    goal: "Daily status update",
    language: "en",
};

const pipeline = routeMeeting(classification);
const prompt = pipeline.prompt(transcript);

assert.equal(pipeline.meetingType, "other");
assert.equal(pipeline.promptVersion, genericPromptVersion);
assert.equal(pipeline.schema, genericIntelligenceSchema);
assert.ok(prompt.includes(transcript.trim()));
assert.ok(!prompt.includes("// Speaker 1"));

console.log(JSON.stringify({
    classifiedAs: classification.meetingType,
    routedTo: pipeline.meetingType,
    promptVersion: pipeline.promptVersion,
    usesGenericSchema: pipeline.schema === genericIntelligenceSchema,
    promptContainsTranscript: prompt.includes(transcript.trim()),
}, null, 2));
