import { extname } from "node:path";
import { ALLOWED_FILE_EXTENSIONS, ALLOWED_MIME_PREFIXES } from "../constants.js";

/**
 * Shared upload allowlists. Exposed as predicates so API validation can return
 * a 400 while storage services keep their own defensive checks.
 */
export const isValidMimeType = (mimeType: string): boolean =>
    ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));

export const isValidFileExtension = (fileName: string): boolean =>
    ALLOWED_FILE_EXTENSIONS.includes(extname(fileName).toLowerCase());

export const assertValidMimeType = (mimeType: string): void => {
    if (!isValidMimeType(mimeType)) {
        throw new Error(`Unsupported file type: ${mimeType}. Only audio/video files are allowed.`);
    }
};

export const assertValidFileExtension = (fileName: string): void => {
    if (!isValidFileExtension(fileName)) {
        throw new Error(`Unsupported file extension: ${fileName}. Only audio/video files are allowed.`);
    }
};
