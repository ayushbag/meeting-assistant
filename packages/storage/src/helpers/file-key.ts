import { randomUUID } from "node:crypto";

const sanitizeFileName = (fileName: string): string => {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
};

/**
 * Builds a collision-safe object key under the `recordings/<meetingId>/` prefix.
 * The random UUID prefix guarantees two uploads with the same filename can never
 * overwrite each other, and keeps every object for a meeting grouped together.
 */
export const buildFileKey = (meetingId: string, fileName: string): string => {
    return `recordings/${meetingId}/${randomUUID()}-${sanitizeFileName(fileName)}`;
};

/**
 * Builds a deterministic object key for a worker-generated artifact under
 * `recordings/<meetingId>/<artifactType>/`.
 *
 * Unlike {@link buildFileKey}, the key contains no random component: there is
 * at most one artifact of a given type per meeting, so a retried job overwrites
 * the same object instead of leaking duplicates. The artifact prefix keeps
 * every object for a meeting grouped together (and under
 * `recordings/<meetingId>/`, so `deleteObjectsForMeeting` cleans it up).
 */
export const buildArtifactFileKey = (
    meetingId: string,
    artifactType: string,
    fileName: string,
): string => {
    return `recordings/${meetingId}/${artifactType}/${sanitizeFileName(fileName)}`;
};
