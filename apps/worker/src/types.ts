export type FFprobeStream = {
    codec_type: 'video' | 'audio';
    codec_name: string;
    width?: number;
    height?: number;
    avg_frame_rate?: string;
    sample_rate?: string;
    channels?: number;
};

export type FFprobeFormat = {
    duration: string;
    size: string;
    bit_rate: string;
    format_name: string;
};

export type FFprobeOutput = {
    streams: FFprobeStream[];
    format: FFprobeFormat;
};

export type MediaFileMetadata = {
    duration: number;
    size: number;
    bitRate: number;
    format: string;
    video?: {
        codec: string;
        width: number;
        height: number;
        fps: number;
    };
    audio?: {
        codec: string;
        sampleRate: number;
        channels: number;
    };
};

/**
 * Metadata of an extracted audio artifact that has been uploaded to storage.
 * Everything needed to persist the audio columns on the Recording row.
 */
export type UploadedAudio = {
    fileKey: string;
    fileName: string;
    mimeType: string;
    size: number;
};
