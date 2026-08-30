import z from "zod";
import { commonIntelligenceSchema } from "./common.js";

export const genericIntelligenceSchema = commonIntelligenceSchema;

export type GenericIntelligence = z.infer<typeof genericIntelligenceSchema>;