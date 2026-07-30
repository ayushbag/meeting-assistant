import { Router } from 'express';
import {
    createMeetingController,
    deleteMeetingController,
    getMeetingController,
    getMeetingsController,
    updateMeetingController,
} from '../controller/meeting.controller.js';

export const meetingRoutes: Router = Router();

meetingRoutes.post('/', createMeetingController);
meetingRoutes.get('/', getMeetingsController);
meetingRoutes.get('/:meetingId', getMeetingController);
meetingRoutes.patch('/:meetingId', updateMeetingController);
meetingRoutes.delete('/:meetingId', deleteMeetingController);
