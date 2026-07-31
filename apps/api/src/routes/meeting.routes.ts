import { Router } from 'express';
import {
    completeMultipartUploadController,
    createMeetingController,
    deleteMeetingController,
    getMeetingController,
    getMeetingsController,
    getMultipartUploadPartUrlController,
    initiateMultipartUploadController,
    updateMeetingController,
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
