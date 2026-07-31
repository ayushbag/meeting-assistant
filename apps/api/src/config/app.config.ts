import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    // Application
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    BASE_PATH: z.string().default('/api'),

    // Authentication — JWT
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),

    // OAuth
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CALLBACK_URL: z.string().url().optional(),

    // Frontend
    FRONTEND_ORIGIN: z.string().url(),

    // Shared Infrastructure
    REDIS_URL: z.string().url(),

    // AI
    GEMINI_API_KEY: z.string().optional(),

    // Object Storage (MinIO / AWS S3)
    S3_ENDPOINT: z.string().url(),
    S3_REGION: z.string(),
    S3_ACCESS_KEY: z.string(),
    S3_SECRET_KEY: z.string(),
    S3_BUCKET_NAME: z.string(),
});

export const env = envSchema.parse(process.env);
