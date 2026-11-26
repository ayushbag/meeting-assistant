import { Router } from 'express';
import {
    abortMultipartUploadController,
    completeMultipartUploadController,
    createMeetingController,
    deleteMeetingController,
    getIntelligenceController,
    getMeetingController,
    getMeetingsController,
    getMeetingStatusController,
    getMultipartUploadPartUrlController,
    getSummaryController,
    getTranscriptController,
    initiateMultipartUploadController,
    listMultipartUploadPartsController,
    retryMeetingController,
    sendChatMessageController,
    updateMeetingController,
    updateMeetingTypeController,
} from '../controller/meeting.controller.js';

export const meetingRoutes: Router = Router();

meetingRoutes.post('/', createMeetingController);
meetingRoutes.get('/', getMeetingsController);
meetingRoutes.get('/:meetingId', getMeetingController);
meetingRoutes.patch('/:meetingId', updateMeetingController);
meetingRoutes.delete('/:meetingId', deleteMeetingController);

meetingRoutes.post('/:meetingId/uploads/initiate', initiateMultipartUploadController);
meetingRoutes.post('/:meetingId/uploads/part-url', getMultipartUploadPartUrlController);
meetingRoutes.post('/:meetingId/uploads/complete', completeMultipartUploadController);
meetingRoutes.post('/:meetingId/uploads/abort', abortMultipartUploadController);
meetingRoutes.get('/:meetingId/uploads/parts', listMultipartUploadPartsController);

meetingRoutes.get('/:meetingId/status', getMeetingStatusController);
meetingRoutes.get('/:meetingId/transcript', getTranscriptController);
meetingRoutes.get('/:meetingId/summary', getSummaryController);
meetingRoutes.get('/:meetingId/intelligence', getIntelligenceController);
meetingRoutes.post('/:meetingId/chat', sendChatMessageController);
meetingRoutes.post('/:meetingId/retry', retryMeetingController);
meetingRoutes.patch('/:meetingId/type', updateMeetingTypeController);