import { buildArtifactFileKey } from "../helpers/file-key.js";
import type { UploadArtifactInput, UploadArtifactResult } from "../types.js";
import { uploadFile } from "./upload.service.js";

/**
 * Uploads a worker-generated binary artifact (extracted audio, waveform,
 * thumbnail, screenshot) for a meeting.
 *
 * This is the domain entry point for artifacts: it owns the storage layout by
 * building the object key internally, so callers only need to know *what* they
 * are uploading (meeting + artifact type), never how keys are constructed.
 * The actual PUT is delegated to the generic {@link uploadFile} primitive.
 *
 * Keys are deterministic (`recordings/<meetingId>/<artifactType>/<fileName>`),
 * so a retried job overwrites the same object instead of creating duplicates.
 * Text artifacts (transcripts, summaries) belong in the database and
 * embeddings in a vector store — they are not uploaded here.
 */
export const uploadArtifact = async ({
    client,
    bucket,
    meetingId,
    artifactType,
    fileName,
    body,
    mimeType,
}: UploadArtifactInput): Promise<UploadArtifactResult> => {
    const fileKey = buildArtifactFileKey(meetingId, artifactType, fileName);

    // Errors propagate from uploadFile, which already logs them with the full
    // object key (containing the meeting and artifact type).
    return uploadFile({
        client,
        bucket,
        fileKey,
        body,
        mimeType,
    });
};
