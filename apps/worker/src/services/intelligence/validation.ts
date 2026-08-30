import type { IntelligencePipeline } from "./router.js";

export const validateIntelligence = (
    data: unknown,
    pipeline: IntelligencePipeline
) => {
    return pipeline.schema.safeParse(data);
}