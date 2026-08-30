import { segmentTranscript } from './segmenter.js';

const transcript = `
[00:00] Speaker 1: Good morning everyone. Let's discuss the Q3 roadmap.
[00:05] Speaker 2: I think we should prioritize the mobile application.
[00:10] Speaker 1: Agreed. What about the backend migration?
[00:15] Speaker 3: The migration will probably take two weeks.
[00:20] Speaker 2: We should assign someone to own that task.
[00:25] Speaker 1: I'll take ownership of the migration.
[00:30] Speaker 3: We also need to decide the launch date.
[00:35] Speaker 1: Let's target September 15th.
[00:40] Speaker 2: That works for me.
`.trim();

const segments = segmentTranscript(transcript, 180);

console.dir(segments, { depth: null });