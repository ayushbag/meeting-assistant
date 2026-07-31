import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@repo/logger";
import { isNotFoundError } from "../helpers/errors.js";
import type { HeadRecordingInput, HeadRecordingResult } from "../types.js";

/**
 * Returns metadata about an object without downloading its body.
 * Used to verify an upload actually landed (and its size) before a `Recording`
 * row is persisted.
 */
export const headRecording = async ({
    client,
    bucket,
    fileKey,
}: HeadRecordingInput): Promise<HeadRecordingResult> => {
    try {
        const output = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: fileKey }));

        return {
            exists: true,
            mimeType: output.ContentType,
            size: output.ContentLength,
            lastModified: output.LastModified,
        };
    } catch (error) {
        if (isNotFoundError(error)) {
            return { exists: false };
        }
        logger.error({ err: error, bucket, key: fileKey }, "Failed to head object in storage");
        throw new Error("Failed to check file in storage");
    }
};
