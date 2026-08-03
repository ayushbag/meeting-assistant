import fs from 'node:fs';
import fsPromise from 'node:fs/promises';
import path from 'path';

import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

import { downloadRecording } from '@repo/storage';

import { env } from '../config/app.config.js';
import { getStorageClient } from '../config/storage.config.js';
import { TEMP_DIR } from '../utils/paths.js';

export const downloadRecordingToTemp = async (
    recordingId: string,
    fileName: string,
    fileKey: string,
): Promise<string> => {
    await fsPromise.mkdir(TEMP_DIR, {
        recursive: true,
    });

    const localPath = path.join(TEMP_DIR, `${recordingId}-${fileName}`);

    const result = await downloadRecording({
        client: getStorageClient(),
        bucket: env.S3_BUCKET_NAME,
        fileKey,
    });

    if (!result.body) {
        throw new Error('Recording body is empty');
    }

    const writeStream = fs.createWriteStream(localPath);

    await pipeline(result.body as Readable, writeStream);

    return localPath;
};
