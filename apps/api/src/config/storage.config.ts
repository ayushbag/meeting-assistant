import { createStorageClient, type StorageClient } from '@repo/storage';
import { env } from './app.config.js';

let storageClient: StorageClient | undefined;

/**
 * Returns the singleton S3 client, creating it lazily on first use.
 * The S3Client is designed to be reused across requests (it pools connections),
 * so it should never be instantiated per-request or per-upload.
 */
export const getStorageClient = (): StorageClient => {
    if (!storageClient) {
        storageClient = createStorageClient({
            endpoint: env.S3_ENDPOINT,
            region: env.S3_REGION,
            accessKeyId: env.S3_ACCESS_KEY,
            secretAccessKey: env.S3_SECRET_KEY,
            forcePathStyle: true,
        });
    }
    return storageClient;
};

export const storageBucket = env.S3_BUCKET_NAME;
