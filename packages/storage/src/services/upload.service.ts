import { PutObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@repo/logger";
import type { UploadFileInput, UploadFileResult } from "../types.js";

/**
 * Uploads a single object to storage using PutObject.
 *
 * Unlike {@link createMultipartUpload} (which streams large files in parts
 * directly from a browser), this is intended for worker-side binary artifacts
 * that already exist locally — extracted audio, waveform images, thumbnails,
 * screenshots — and can be sent as a whole body (buffer, stream, etc.).
 *
 * For idempotent retries, callers should pass a deterministic `fileKey` so a
 * re-run of the same job overwrites the same object instead of creating
 * duplicates.
 *
 * PutObject does not return a content length, so callers that need the stored
 * size should verify the object afterwards with `headRecording`.
 */
export const uploadFile = async ({
    client,
    bucket,
    fileKey,
    body,
    mimeType,
}: UploadFileInput): Promise<UploadFileResult> => {
    try {
        await client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: fileKey,
                Body: body,
                ContentType: mimeType,
            })
        );

        return { fileKey };
    } catch (error) {
        logger.error({ err: error, bucket, key: fileKey }, "Failed to upload file to storage");
        throw new Error("Failed to upload file to storage");
    }
};
