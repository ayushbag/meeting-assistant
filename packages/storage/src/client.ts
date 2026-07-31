import { S3Client } from '@aws-sdk/client-s3';
import type { StorageConfig } from './types.js';

export type StorageClient = S3Client;

export const createStorageClient = (config: StorageConfig): StorageClient => {
    return new S3Client({
        endpoint: config.endpoint,
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
        },
        forcePathStyle: config.forcePathStyle
    });
}