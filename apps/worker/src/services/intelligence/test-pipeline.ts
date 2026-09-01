import { runIntelligencePipeline } from "./pipeline.js";

// type: other
// const transcript = `
// Speaker 1: Hey, are you coming to Pune this weekend?

// Speaker 2: I think so. I'm planning to come on Saturday morning.

// Speaker 1: Nice. We could go out for lunch.

// Speaker 2: Sure. Do you know any good places around FC Road?

// Speaker 1: There is a new cafe I wanted to try.

// Speaker 2: Sounds good. What time should we meet?

// Speaker 1: Maybe around one?

// Speaker 2: Yeah, one works for me.

// Speaker 1: Perfect. I'll message you the location on Saturday.

// Speaker 2: Cool. See you then.
// `;

// type: business
const transcript = `
Speaker 1: Let's discuss the launch of our new analytics platform.

Speaker 2: The product is almost ready, but we still need two more days of testing.

Speaker 1: Then I think we should move the launch to September 15th.

Speaker 2: Agreed. September 15th works for us.

Speaker 1: One concern is that our external vendor hasn't confirmed the API capacity yet.

Speaker 2: Yes, that's a risk. I'll contact them tomorrow and get confirmation before Friday.

Speaker 1: Good. We also discussed increasing the marketing budget, but we haven't decided on the amount yet.

Speaker 2: Let's discuss the budget in our next meeting.
`

const pipeline = await runIntelligencePipeline(transcript, 'cmtittcxg0000i8tu1fpm8xk1');

console.dir(pipeline, { depth: null });