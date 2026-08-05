import { logger } from '@repo/logger';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import fs from 'node:fs';
import path from 'node:path';

import { uploadArtifact } from '@repo/storage';
import { env } from '../config/app.config.js';
import { getStorageClient } from '../config/storage.config.js';
import type { UploadedAudio } from '../types.js';
import { prisma } from '@repo/db';

const execFileAsync = promisify(execFile);

export const extractAudio = async (inputPath: string): Promise<string> => {
    const outputPath = inputPath.replace(/\.[^.]+$/, '.wav');

    await execFileAsync('ffmpeg', [
        '-y',
        '-i',
        inputPath,
        '-vn',
        '-ac',
        '1',
        '-ar',
        '16000',
        '-c:',
        'pcm_s16le',
        outputPath,
    ]);

    // logging
    logger.info(`Audio extracted at path: ${outputPath}`);

    return outputPath;
};

export const uploadExtractedAudio = async (
    meetingId: string,
    wavPath: string,
): Promise<UploadedAudio> => {
    const stream = fs.createReadStream(wavPath);

    const fileName = path.basename(wavPath);

    const { size } = await fs.promises.stat(wavPath);

    const uploadedAudio = await uploadArtifact({
        client: getStorageClient(),
        bucket: env.S3_BUCKET_NAME,
        meetingId,
        artifactType: 'audio',
        fileName,
        body: stream,
        mimeType: 'audio/wav',
    });

    logger.info(
        {
            meetingId,
            audioKey: uploadedAudio.fileKey,
            audioSize: size,
        },
        'Extracted audio uploaded successfully',
    );

    return {
        fileKey: uploadedAudio.fileKey,
        fileName,
        mimeType: 'audio/wav',
        size,
    };
};

export const updateRecordingAudio = async (recordingId: string, audio: UploadedAudio) => {
    await prisma.recording.update({
        where: {
            id: recordingId,
        },
        data: {
            audioFileName: audio.fileName,
            audioFileKey: audio.fileKey,
            audioMimeType: audio.mimeType,
            audioSize: BigInt(audio.size),
        },
    });

    // logging
    logger.info(
        {
            recordingId,
            audioKey: audio.fileKey,
        },
        'Recording audio metadata updated',
    );
};
