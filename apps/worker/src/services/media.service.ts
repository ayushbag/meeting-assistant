import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parseFrameRate } from '../utils/ffmpeg.js';
import { FFprobeOutput, MediaFileMetadata } from '../types.js';

import fs from 'node:fs/promises';

const execFileAsync = promisify(execFile);

/**
 * Gets metadata about recording using ffprobe
 */
export const getMediaMetadata = async (filePath: string): Promise<MediaFileMetadata> => {
    const { stdout } = await execFileAsync('ffprobe', [
        '-v',
        'quiet',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        filePath,
    ]);

    const metadata: FFprobeOutput = JSON.parse(stdout);

    // Audio-only uploads are valid (the product's canonical artifact is the WAV,
    // and clients may upload audio files directly), so a video stream is NOT
    // required. Extraction validation (an audio stream must exist) happens in
    // the media processor.
    const videoStream = metadata.streams.find((stream) => stream.codec_type === 'video');
    const audioStream = metadata.streams.find((stream) => stream.codec_type === 'audio');

    return {
        duration: Number(metadata.format.duration),
        size: Number(metadata.format.size),
        bitRate: Number(metadata.format.bit_rate),
        format: metadata.format.format_name,

        video: videoStream
            ? {
                  codec: videoStream.codec_name,
                  width: videoStream.width ?? 0,
                  height: videoStream.height ?? 0,
                  fps: parseFrameRate(videoStream.avg_frame_rate ?? '0/1'),
              }
            : undefined,

        audio: audioStream
            ? {
                  codec: audioStream.codec_name,
                  sampleRate: Number(audioStream.sample_rate),
                  channels: audioStream.channels ?? 0,
              }
            : undefined,
    };
};

export const cleanupTempFiles = async (...paths: string[]) => {
    await Promise.all(
        paths.map(async (path) => {
            if (!path) return;

            try {
                await fs.unlink(path);
            } catch {
                // ignore
            }
        }),
    );
};
