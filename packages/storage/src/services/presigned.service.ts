import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "@repo/logger";
import type { GetPresignedDownloadUrlInput } from "../types.js";

/**
 * Returns a short-lived presigned GET URL for securely streaming/playing a
 * recording without making the bucket public.
 */
export const getPresignedDownloadUrl = async ({
    client,
    bucket,
    fileKey,
    expiresInSeconds = 3600,
}: GetPresignedDownloadUrlInput): Promise<string> => {
    try {
        const url = await getSignedUrl(
            client,
            new GetObjectCommand({ Bucket: bucket, Key: fileKey }),
            { expiresIn: expiresInSeconds }
        );

        return url;
    } catch (error) {
        logger.error({ err: error, bucket, key: fileKey }, "Failed to generate presigned download URL");
        throw new Error("Failed to generate download URL");
    }
};
