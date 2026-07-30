import type { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { HTTPSTATUS } from '../config/http.config.js';
import { createMeetingSchema, updateMeetingSchema } from '../validation/meeting.validation.js';
import {
    createMeetingService,
    deleteMeetingService,
    getMeetingService,
    getMeetingsService,
    updateMeetingService,
} from '../service/meeting.service.js';

export const createMeetingController = asyncHandler(async (req: Request, res: Response) => {
    const body = createMeetingSchema.parse(req.body);
    const userId = req.user!.userId;

    const meeting = await createMeetingService(body, userId);

    return res.status(HTTPSTATUS.CREATED).json({
        message: 'Meeting created successfully',
        meeting,
    });
});

export const getMeetingsController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const meetings = await getMeetingsService(userId);

    return res.status(HTTPSTATUS.OK).json({
        message: 'Fetched meetings successfully',
        meetings,
    });
});

export const getMeetingController = asyncHandler(async (req: Request, res: Response) => {
    const meetingId = req.params.meetingId as string;

    const meeting = await getMeetingService(meetingId);

    return res.status(HTTPSTATUS.OK).json({
        message: 'Meeting fetched successfully',
        meeting,
    });
});

export const updateMeetingController = asyncHandler(async (req: Request, res: Response) => {
    const body = updateMeetingSchema.parse(req.body);
    const meetingId = req.params.meetingId as string;

    const meeting = await updateMeetingService(body, meetingId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Updated meeting successfully",
        meeting,
    });
});

export const deleteMeetingController = asyncHandler(async (req: Request, res: Response) => {
    const meetingId = req.params.meetingId as string;

    await deleteMeetingService(meetingId);

    return res.status(HTTPSTATUS.OK).json({
        message: "Deleted meeting successfully",
    });
});