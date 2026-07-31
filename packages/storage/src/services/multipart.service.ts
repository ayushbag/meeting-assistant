import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CreateMultipartUploadCommand,
    UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "@repo/logger";
import { MAX_PART_NUMBER } from "../constants.js";
import { isNotFoundError } from "../helpers/errors.js";
import { buildFileKey } from "../helpers/file-key.js";
import { assertValidMimeType } from "../helpers/validation.js";
import type {
    AbortMultipartUploadInput,
    AbortMultipartUploadResult,
    CompleteMultipartUploadInput,
    CompleteMultipartUploadResult,
    CreateMultipartUploadInput,
    CreateMultipartUploadResult,
    GetMultipartUploadPartUrlInput,
} from "../types.js";

/**
 * Initiates a multipart upload for a meeting recording.
 *
 * Validates the MIME type, generates a collision-safe object key, and asks S3
 * for an `uploadId` that identifies the in-progress upload. Parts are uploaded
 * afterwards via {@link getMultipartUploadPartUrl} and assembled with
 * {@link completeMultipartUpload} (or discarded with {@link abortMultipartUpload}).
 */
export const createMultipartUpload = async ({
    client,
    bucket,
    meetingId,
    fileName,
    mimeType,
}: CreateMultipartUploadInput): Promise<CreateMultipartUploadResult> => {
    // 1. Validate MIME type (audio/video only)
    assertValidMimeType(mimeType);

    // 2. Build a collision-safe object key
    const fileKey = buildFileKey(meetingId, fileName);

    try {
        // 3. Start the multipart upload
        const output = await client.send(
            new CreateMultipartUploadCommand({
                Bucket: bucket,
                Key: fileKey,
                ContentType: mimeType,
            })
        );

        if (!output.UploadId) {
            throw new Error("Storage did not return an upload ID");
        }

        return {
            uploadId: output.UploadId,
            fileKey,
        };
    } catch (error) {
        logger.error({ err: error, bucket, key: fileKey }, "Failed to initiate multipart upload");
        throw new Error("Failed to initiate multipart upload");
    }
};

/**
 * Returns a short-lived presigned URL for uploading a single part of a
 * multipart upload directly from the client (Chrome extension / web app).
 *
 * The client PUTs the raw part bytes to this URL. S3 rejects any part number
 * outside 1..10000.
 */
export const getMultipartUploadPartUrl = async ({
    client,
    bucket,
    fileKey,
    uploadId,
    partNumber,
    expiresInSeconds = 3600,
}: GetMultipartUploadPartUrlInput): Promise<string> => {
    // Validate part number (S3 requires 1..10000)
    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > MAX_PART_NUMBER) {
        throw new Error(`Invalid part number: ${partNumber}. Must be between 1 and ${MAX_PART_NUMBER}.`);
    }

    try {
        const url = await getSignedUrl(
            client,
            new UploadPartCommand({
                Bucket: bucket,
                Key: fileKey,
                UploadId: uploadId,
                PartNumber: partNumber,
            }),
            { expiresIn: expiresInSeconds }
        );

        return url;
    } catch (error) {
        logger.error(
            { err: error, bucket, key: fileKey, uploadId, partNumber },
            "Failed to generate multipart upload part URL"
        );
        throw new Error("Failed to generate upload part URL");
    }
};

/**
 * Assembles the uploaded parts into the final object.
 *
 * `parts` must be the list of { partNumber, etag } pairs returned by S3 after
 * each part is uploaded (part numbers ascending, every part except the last
 * must be at least 5 MB).
 *
 * NOTE: the total upload size is not capped here. After completion, callers
 * should verify the assembled object with `headRecording` and reject/delete
 * recordings that exceed their configured size limit.
 */
export const completeMultipartUpload = async ({
    client,
    bucket,
    fileKey,
    uploadId,
    parts,
}: CompleteMultipartUploadInput): Promise<CompleteMultipartUploadResult> => {
    if (parts.length === 0) {
        throw new Error("Cannot complete a multipart upload without any parts");
    }

    // Validate every part up-front so bad input fails clearly instead of
    // surfacing as an opaque S3 rejection.
    for (const part of parts) {
        if (!Number.isInteger(part.partNumber) || part.partNumber < 1 || part.partNumber > MAX_PART_NUMBER) {
            throw new Error(`Invalid part number: ${part.partNumber}. Must be between 1 and ${MAX_PART_NUMBER}.`);
        }
        if (part.etag.length === 0) {
            throw new Error(`Part ${part.partNumber} is missing an ETag`);
        }
    }

    try {
        const output = await client.send(
            new CompleteMultipartUploadCommand({
                Bucket: bucket,
                Key: fileKey,
                UploadId: uploadId,
                MultipartUpload: {
                    Parts: parts.map((part) => ({
                        PartNumber: part.partNumber,
                        ETag: part.etag,
                    })),
                },
            })
        );

        return {
            fileKey,
            location: output.Location,
        };
    } catch (error) {
        // NoSuchUpload (404) means the multipart upload was already completed or
        // aborted — e.g. a retried complete of an upload that already succeeded.
        // The object may still exist, so treat it as benign and let the caller
        // verify with headRecording. Same pattern as abortMultipartUpload.
        if (isNotFoundError(error)) {
            return { fileKey };
        }

        logger.error({ err: error, bucket, key: fileKey, uploadId }, "Failed to complete multipart upload");
        throw new Error("Failed to complete multipart upload");
    }
};

/**
 * Cancels an in-progress multipart upload and removes the uploaded parts.
 * Call this on client failure/cancellation so partially uploaded data does not
 * linger and accumulate charges.
 */
export const abortMultipartUpload = async ({
    client,
    bucket,
    fileKey,
    uploadId,
}: AbortMultipartUploadInput): Promise<AbortMultipartUploadResult> => {
    try {
        await client.send(
            new AbortMultipartUploadCommand({
                Bucket: bucket,
                Key: fileKey,
                UploadId: uploadId,
            })
        );

        return { fileKey, aborted: true };
    } catch (error) {
        // Treat an already-aborted/completed upload (NoSuchUpload) as success so
        // repeated cleanup attempts do not fail — same pattern as headRecording.
        if (isNotFoundError(error)) {
            return { fileKey, aborted: true };
        }

        logger.error({ err: error, bucket, key: fileKey, uploadId }, "Failed to abort multipart upload");
        throw new Error("Failed to abort multipart upload");
    }
};
