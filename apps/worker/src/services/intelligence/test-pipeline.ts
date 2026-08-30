import { runIntelligencePipeline } from "./pipeline.js";

// type: other
const transcript = `
Speaker 1: Hey, are you coming to Pune this weekend?

Speaker 2: I think so. I'm planning to come on Saturday morning.

Speaker 1: Nice. We could go out for lunch.

Speaker 2: Sure. Do you know any good places around FC Road?

Speaker 1: There is a new cafe I wanted to try.

Speaker 2: Sounds good. What time should we meet?

Speaker 1: Maybe around one?

Speaker 2: Yeah, one works for me.

Speaker 1: Perfect. I'll message you the location on Saturday.

Speaker 2: Cool. See you then.
`;

const pipeline = await runIntelligencePipeline(transcript, 'cmtflfv77000178tubw77m0in');

console.dir(pipeline, { depth: null });