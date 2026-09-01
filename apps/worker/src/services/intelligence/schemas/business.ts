import z from "zod";
import { commonIntelligenceSchema, evidenceSchema } from "./common.js";

const decisionSchema = z.object({
    decision: z.string().min(1),
    owner: z.string().optional(),
    evidence: evidenceSchema.optional()
})

const discussionPointSchema = z.object({
    topic: z.string().min(1),
    summary: z.string().min(1),
    evidence: evidenceSchema.optional(),
});

const riskSchema = z.object({
    risk: z.string().min(1),
    impact: z.string().optional(),
    evidence: evidenceSchema.optional(),
});

export const businessIntelligenceSchema =
    commonIntelligenceSchema.extend({
        decisions: z.array(decisionSchema),
        discussionPoints: z.array(discussionPointSchema),
        risks: z.array(riskSchema),
    });

export type BusinessIntelligence = z.infer<
    typeof businessIntelligenceSchema
>;