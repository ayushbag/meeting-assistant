import { createStorageClient, type StorageClient } from '@repo/storage';
import { env } from './app.config.js';

let storageClient: StorageClient | undefined;

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
