import { z } from "zod";

export const evidenceSchema = z.object({
    sourceSegment: z.number().int().nonnegative(),
    quote: z.string().min(1),
});

export const participantSchema = z.object({
    name: z.string().min(1),
    role: z.string().optional(),
});

export const importantMomentSchema = z.object({
    summary: z.string().min(1),
    timestamp: z.string().optional(),
    evidence: evidenceSchema.optional(),
});

export const actionItemSchema = z.object({
    task: z.string().min(1),
    owner: z.string().optional(),
    deadline: z.string().optional(),
    timestamp: z.string().optional(),
    importance: z.enum(['low', 'medium', 'high']).optional(),
    evidence: evidenceSchema.optional(),
});

export const commonIntelligenceSchema = z.object({
    keyTopics: z.array(z.string()),

    participants: z.array(participantSchema),

    importantMoments: z.array(
        importantMomentSchema,
    ),

    openQuestions: z.array(z.string()),

    outcomes: z.array(z.string()),

    actionItems: z.array(
        actionItemSchema,
    ),
});

export type CommonIntelligence = z.infer<
    typeof commonIntelligenceSchema
>;