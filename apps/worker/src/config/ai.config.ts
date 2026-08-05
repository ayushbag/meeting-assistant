import { createAI } from "@repo/ai";

import { env } from "./app.config.js";

export const ai = createAI({
    provider: "gemini",
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL
});