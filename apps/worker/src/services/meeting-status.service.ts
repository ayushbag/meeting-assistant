import { MeetingStatus, prisma, RecordingStatus } from '@repo/db';
import { logger } from '@repo/logger';

import { updateRecordingStatus } from './recording.service.js';

const errorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

const setMeetingStatus = async (
    meetingId: string,
    status: MeetingStatus,
    error: string | null = null,
) => {
    await prisma.meeting.update({
        where: { id: meetingId },
        data: { status, error },
    });
};

/** Media extraction started: both models leave the upload state. */
export const startMediaExtraction = async (recordingId: string, meetingId: string) => {
    await setMeetingStatus(meetingId, MeetingStatus.PROCESSING);
    await updateRecordingStatus(recordingId, RecordingStatus.EXTRACTING_AUDIO);
};

/** Audio is persisted and the AI job is enqueued; transcription is next. */
export const finishMediaExtraction = async (recordingId: string, meetingId: string) => {
    await setMeetingStatus(meetingId, MeetingStatus.PROCESSING);
    await updateRecordingStatus(recordingId, RecordingStatus.TRANSCRIBING);
};

/** AI processing started, either from transcription or a later stage. */
export const startAIProcessing = async (recordingId: string, meetingId: string) => {
    await setMeetingStatus(meetingId, MeetingStatus.PROCESSING);
    await updateRecordingStatus(recordingId, RecordingStatus.TRANSCRIBING);
};

/** Transcript persisted; summary generation is reserved for the next stage. */
export const markSummarizing = async (recordingId: string, meetingId: string) => {
    await setMeetingStatus(meetingId, MeetingStatus.PROCESSING);
    await updateRecordingStatus(recordingId, RecordingStatus.SUMMARIZING);
};

/** Intelligence, indexing, and downstream artifacts are complete. */
export const markCompleted = async (recordingId: string, meetingId: string) => {
    await setMeetingStatus(meetingId, MeetingStatus.COMPLETED);
    await updateRecordingStatus(recordingId, RecordingStatus.COMPLETED);
};

/** Any failure is terminal for the current attempt and carries a reason. */
export const markFailed = async (
    recordingId: string,
    meetingId: string,
    error: unknown,
) => {
    const message = errorMessage(error);

    try {
        await setMeetingStatus(meetingId, MeetingStatus.FAILED, message);
        await updateRecordingStatus(recordingId, RecordingStatus.FAILED, message);
    } catch (statusError) {
        // The original pipeline error is the one worth surfacing to BullMQ.
        logger.error(
            { err: statusError, recordingId, meetingId },
            'Failed to persist failure status',
        );
    }
};
