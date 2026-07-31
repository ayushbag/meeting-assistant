import { ALLOWED_MIME_PREFIXES } from "../constants.js";

/**
 * Validates that a MIME type is an audio/video recording.
 * Shared by every upload path so the allowlist can never drift.
 */
export const assertValidMimeType = (mimeType: string): void => {
    const isAllowedType = ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
    if (!isAllowedType) {
        throw new Error(`Unsupported file type: ${mimeType}. Only audio/video files are allowed.`);
    }
};
