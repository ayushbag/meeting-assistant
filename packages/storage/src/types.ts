import type { GetObjectCommandOutput, PutObjectCommandInput } from "@aws-sdk/client-s3";
import type { StorageClient } from "./client.js";

export type StorageConfig = {
    endpoint: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    forcePathStyle?: boolean;
};

export type CreateMultipartUploadInput = {
    client: StorageClient;
    bucket: string;
    meetingId: string;
    fileName: string;
    mimeType: string;
};

export type CreateMultipartUploadResult = {
    uploadId: string;
    fileKey: string;
};

export type GetMultipartUploadPartUrlInput = {
    client: StorageClient;
    bucket: string;
    fileKey: string;
    uploadId: string;
    partNumber: number;
    expiresInSeconds?: number;
};

export type MultipartUploadPart = {
    partNumber: number;
    etag: string;
};

export type CompleteMultipartUploadInput = {
    client: StorageClient;
    bucket: string;
    fileKey: string;
    uploadId: string;
    parts: MultipartUploadPart[];
};

export type CompleteMultipartUploadResult = {
    fileKey: string;
    location?: string;
};

export type AbortMultipartUploadInput = {
    client: StorageClient;
    bucket: string;
    fileKey: string;
    uploadId: string;
};

export type AbortMultipartUploadResult = {
    fileKey: string;
    aborted: boolean;
};

export type DownloadRecordingInput = {
    client: StorageClient;
    bucket: string;
    fileKey: string;
};

export type DownloadRecordingResult = {
    body: GetObjectCommandOutput["Body"];
    mimeType?: string;
    size?: number;
    lastModified?: Date;
};

export type HeadRecordingInput = DownloadRecordingInput;

export type HeadRecordingResult = {
    exists: boolean;
    mimeType?: string;
    size?: number;
    lastModified?: Date;
};

export type DeleteRecordingInput = DownloadRecordingInput;

export type DeleteRecordingResult = {
    fileKey: string;
    deleted: boolean;
};

export type DeleteObjectsForMeetingInput = {
    client: StorageClient;
    bucket: string;
    meetingId: string;
};

export type DeleteObjectsForMeetingResult = {
    deleted: number;
};

export type GetPresignedDownloadUrlInput = {
    client: StorageClient;
    bucket: string;
    fileKey: string;
    expiresInSeconds?: number;
};

export type UploadFileInput = {
    client: StorageClient;
    bucket: string;
    fileKey: string;
    body: PutObjectCommandInput["Body"];
    mimeType: string;
};

export type UploadFileResult = {
    fileKey: string;
};

/**
 * Binary artifacts stored in object storage. Text artifacts (transcripts,
 * summaries) live in the database and embeddings in a vector store, so they
 * are intentionally absent here.
 */
export type ArtifactType = "audio" | "waveform" | "thumbnail" | "screenshot";

export type UploadArtifactInput = {
    client: StorageClient;
    bucket: string;
    meetingId: string;
    artifactType: ArtifactType;
    fileName: string;
    body: PutObjectCommandInput["Body"];
    mimeType: string;
};

export type UploadArtifactResult = {
    fileKey: string;
};
