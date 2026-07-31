import {
    DeleteObjectCommand,
    DeleteObjectsCommand,
    ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { logger } from "@repo/logger";
import type {
    DeleteObjectsForMeetingInput,
    DeleteObjectsForMeetingResult,
    DeleteRecordingInput,
    DeleteRecordingResult,
} from "../types.js";

/**
 * Deletes a single recording object from storage.
 * Use alongside the DB-level meeting/recording deletion so files do not leak.
 */
export const deleteRecording = async ({
    client,
    bucket,
    fileKey,
}: DeleteRecordingInput): Promise<DeleteRecordingResult> => {
    try {
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: fileKey }));
        return { fileKey, deleted: true };
    } catch (error) {
        logger.error({ err: error, bucket, key: fileKey }, "Failed to delete object from storage");
        throw new Error("Failed to delete file from storage");
    }
};

/**
 * Deletes every object under `recordings/<meetingId>/`.
 *
 * ListObjectsV2 and DeleteObjects are both paged/limited (max 1000 per call),
 * so this loops until no continuation token is returned. This also cleans up
 * objects that an upload pipeline never reported (orphans).
 */
export const deleteObjectsForMeeting = async ({
    client,
    bucket,
    meetingId,
}: DeleteObjectsForMeetingInput): Promise<DeleteObjectsForMeetingResult> => {
    const prefix = `recordings/${meetingId}/`;
    let deleted = 0;
    let continuationToken: string | undefined;

    try {
        do {
            const listed = await client.send(
                new ListObjectsV2Command({
                    Bucket: bucket,
                    Prefix: prefix,
                    ContinuationToken: continuationToken,
                })
            );

            const keys = (listed.Contents ?? [])
                .map((object) => object.Key)
                .filter((key): key is string => typeof key === "string");

            if (keys.length > 0) {
                const output = await client.send(
                    new DeleteObjectsCommand({
                        Bucket: bucket,
                        Delete: { Objects: keys.map((key) => ({ Key: key })) },
                    })
                );

                // Count only successful deletions; log any that failed.
                deleted += output.Deleted?.length ?? 0;
                for (const failed of output.Errors ?? []) {
                    logger.error({ bucket, key: failed.Key, code: failed.Code }, "Failed to delete object");
                }
            }

            continuationToken = listed.NextContinuationToken;
        } while (continuationToken);
    } catch (error) {
        logger.error({ err: error, bucket, prefix }, "Failed to delete objects for meeting");
        throw new Error("Failed to delete meeting recordings from storage");
    }

    return { deleted };
};
