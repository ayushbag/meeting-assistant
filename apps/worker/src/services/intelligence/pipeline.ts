import { classifyMeeting } from './classifier.js';
import { verifyEvidence } from './evidence.js';
import { extractIntelligence } from './extractor.js';
import { mergeIntelligence } from './merger.js';
import { persistIntelligence } from './persist.js';
import { routeMeeting } from './router.js';
import { segmentTranscript } from './segmenter.js';

export const runIntelligencePipeline = async (transcript: string, meetingId: string) => {
    // classify the meeting
    const classification = await classifyMeeting(transcript);

    console.log('classification ✅');

    // route to the correct intelligence pipeline
    const pipeline = routeMeeting(classification);

    console.log('routeMeeting ✅');

    // segment the transcript
    const segments = segmentTranscript(transcript);

    console.log('segmentation ✅');

    // extract intelligence from each segement
    const results = [];

    for (const segment of segments) {
        const result = await extractIntelligence(segment.text, pipeline);

        results.push({
            segmentIndex: segment.index,
            intelligence: result,
        });
    }

    console.log('extraction ✅');

    // merge segment intelligence
    const intelligence = await mergeIntelligence(results, pipeline);

    console.log('merged ✅');

    verifyEvidence(intelligence, segments);

    console.log('evidence verified ✅');

    await persistIntelligence({
        meetingId,
        classification,
        intelligence,
        segmentCount: segments.length,
    });

    console.log('intelligence added to db ✅');

    return {
        classification,
        intelligence,
    };
};
