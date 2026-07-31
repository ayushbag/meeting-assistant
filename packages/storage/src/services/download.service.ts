import { GetObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@repo/logger";
import { isNotFoundError } from "../helpers/errors.js";
import type { DownloadRecordingInput, DownloadRecordingResult } from "../types.js";

/**
 * Streams a recording object out of storage.
 *
 * The body is returned as a stream (not buffered) so large recordings can be
 * piped to a client response or into the audio-processing pipeline without
 * loading the whole file into memory.
 */
export const downloadRecording = async ({
    client,
    bucket,
    fileKey,
}: DownloadRecordingInput): Promise<DownloadRecordingResult> => {
    try {
        const output = await client.send(new GetObjectCommand({ Bucket: bucket, Key: fileKey }));

        return {
            body: output.Body,
            mimeType: output.ContentType,
            size: output.ContentLength,
            lastModified: output.LastModified,
        };
    } catch (error) {
        logger.error({ err: error, bucket, key: fileKey }, "Failed to download object from storage");
        if (isNotFoundError(error)) {
            throw new Error("File not found in storage");
        }
        throw new Error("Failed to download file from storage");
    }
};
