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
Speaker 1: Good morning everyone. Today I want to finalize the launch plan for our customer analytics platform.

Speaker 2: The backend is almost ready. We completed the API integration, but load testing showed some performance issues when we crossed 5,000 concurrent requests.

Speaker 3: How much time do we need to fix that?

Speaker 2: Around four days. We can optimize the database queries and add caching for the most frequently requested data.

Speaker 1: Okay. Let's target Friday for the performance fixes. What about the frontend?

Speaker 3: The dashboard is about 90% complete. The remaining work is mainly responsive design and the export-to-CSV feature.

Speaker 1: Can you finish those by next Wednesday?

Speaker 3: Yes, that should be possible.

Speaker 2: We should also discuss the launch budget. The current marketing estimate is ₹3 lakh, but the team recommends increasing it to ₹4 lakh to support the initial campaign.

Speaker 1: Let's keep the budget at ₹3 lakh for now and review the results after the first two weeks.

Speaker 3: One concern is that we don't have enough production data for the initial testing phase.

Speaker 2: We can use anonymized historical data until we have enough live data.

Speaker 1: Good. Let's proceed with that approach.

Speaker 1: So the decisions are: backend performance fixes by Friday, frontend completion by next Wednesday, and the initial marketing budget stays at ₹3 lakh.

Speaker 2: I'll handle the database optimization and caching work.

Speaker 3: I'll finish responsive design and CSV export.

Speaker 1: Great. We'll have a follow-up meeting next Thursday to review progress and decide the final launch date.
`

const pipeline = await runIntelligencePipeline(transcript, 'cmtllxd610002tstu70kx3uz3');

console.dir(pipeline, { depth: null });