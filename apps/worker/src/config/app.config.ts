import 'dotenv/config';
import z from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    REDIS_URL: z.url(),

    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string(),
    GEMINI_SPEECH_MODEL: z.string(),

    // S3_ENDPOINT is only set for S3-compatible services like MinIO.
    // Leave it unset in production to use real AWS S3 (D6).
    S3_ENDPOINT: z.url().optional(),
    S3_REGION: z.string(),
    S3_ACCESS_KEY: z.string(),
    S3_SECRET_KEY: z.string(),
    S3_BUCKET_NAME: z.string(),
    S3_FORCE_PATH_STYLE: z.string().default('true'),
});

export const env = envSchema.parse(process.env);
