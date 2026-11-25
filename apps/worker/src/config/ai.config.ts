import { createAI } from "@repo/ai";

import { env } from "./app.config.js";

export const ai = createAI({
    textGeneration: {
        provider: "gemini",
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL
    },

    speechToText: {
        provider: "gemini",
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_SPEECH_MODEL
    },

    embeddings: {
        provider: 'gemini',
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_EMBEDDING_MODEL,
        outputDimensionality: 768,
    },
});
