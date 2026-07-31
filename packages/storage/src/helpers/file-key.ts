import { randomUUID } from "node:crypto";

/**
 * Builds a collision-safe object key under the `recordings/<meetingId>/` prefix.
 * The random UUID prefix guarantees two uploads with the same filename can never
 * overwrite each other, and keeps every object for a meeting grouped together.
 */
export const buildFileKey = (meetingId: string, fileName: string): string => {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    return `recordings/${meetingId}/${randomUUID()}-${safeName}`;
};
