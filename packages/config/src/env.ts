import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),

  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string(),

  GEMINI_API_KEY: z.string(),

  JWT_SECRET: z.string(),
});


export const env = envSchema.parse(process.env);