/**
 * Returns true when an AWS SDK error indicates the object does not exist (404).
 * S3 reports 404 via `$metadata.httpStatusCode` for missing keys.
 */
export const isNotFoundError = (error: unknown): boolean => {
    if (error && typeof error === "object") {
        const metadata = (error as { $metadata?: { httpStatusCode?: number } }).$metadata;
        return metadata?.httpStatusCode === 404;
    }
    return false;
};
