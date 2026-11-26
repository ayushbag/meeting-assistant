import type { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { HTTPSTATUS } from '../config/http.config.js';
import {
    abortMultipartUploadSchema,
    completeMultipartUploadSchema,
    createMeetingSchema,
    initiateMultipartUploadSchema,
    listMeetingsQuerySchema,
    listMultipartUploadPartsSchema,
    meetingIdParamSchema,
    multipartUploadPartSchema,
    sendChatMessageSchema,
    updateMeetingSchema,
    updateMeetingTypeSchema,
} from '../validation/meeting.validation.js';
import {
    abortMultipartUploadService,
    completeMultipartUploadService,
    createMeetingService,
    deleteMeetingService,
    getMeetingService,
    getMeetingsService,
    getMeetingStatusService,
    getMultipartUploadPartUrlService,
    initiateMultipartUploadService,
    listMultipartUploadPartsService,
    retryMeetingService,
    updateMeetingService,
    updateMeetingTypeService,
} from '../service/meeting.service.js';
import {
    getIntelligenceResultService,
    getSummaryResultService,
    getTranscriptResultService,
} from '../service/results.service.js';
import {
    askMeetingQuestionService,
    getChatMessagesService,
} from '../service/chat.service.js';

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
    const query = listMeetingsQuerySchema.parse(req.query);
    const userId = req.user!.userId;

    const result = await getMeetingsService(query, userId);

    return res.status(HTTPSTATUS.OK).json({
        message: 'Fetched meetings successfully',
        data: result,
    });
});

export const getMeetingController = asyncHandler(async (req: Request, res: Response) => {
    const meetingId = req.params.meetingId as string;
    const userId = req.user!.userId;

    const meeting = await getMeetingService(meetingId, userId);

    return res.status(HTTPSTATUS.OK).json({
        message: 'Meeting fetched successfully',
        meeting,
    });
});

export const updateMeetingController = asyncHandler(async (req: Request, res: Response) => {
    const body = updateMeetingSchema.parse(req.body);
    const meetingId = req.params.meetingId as string;
    const userId = req.user!.userId;

    const meeting = await updateMeetingService(body, meetingId, userId);

    return res.status(HTTPSTATUS.OK).json({
        message: 'Updated meeting successfully',
        meeting,
    });
});

export const deleteMeetingController = asyncHandler(async (req: Request, res: Response) => {
    const meetingId = req.params.meetingId as string;
    const userId = req.user!.userId;

    const result = await deleteMeetingService(meetingId, userId);

    return res.status(HTTPSTATUS.OK).json({
        message: 'Deleted meeting successfully',
        data: result,
    });
});

export const initiateMultipartUploadController = asyncHandler(
    async (req: Request, res: Response) => {
        const meetingId = req.params.meetingId;
        const userId = req.user?.userId;

        const body = initiateMultipartUploadSchema.parse(req.body);

        const result = await initiateMultipartUploadService(
            body,
            meetingId as string,
            userId as string,
        );

        return res.status(200).json({
            message: 'Multipart upload initiated successfully',
            data: {
                uploadId: result.uploadId,
                fileKey: result.fileKey,
            },
        });
    },
);

export const getMultipartUploadPartUrlController = asyncHandler(
    async (req: Request, res: Response) => {
        const meetingId = req.params.meetingId;
        const userId = req.user?.userId;

        const body = multipartUploadPartSchema.parse(req.body);

        const url = await getMultipartUploadPartUrlService(
            body,
            meetingId as string,
            userId as string,
        );

        return res.status(200).json({
            message: 'Multipart upload URL generated successfully',
            data: {
                url,
            },
        });
    },
);

export const completeMultipartUploadController = asyncHandler(
    async (req: Request, res: Response) => {
        const meetingId = req.params.meetingId;
        const userId = req.user?.userId;

        const body = completeMultipartUploadSchema.parse(req.body);

        const recording = await completeMultipartUploadService(
            body,
            meetingId as string,
            userId as string,
        );

        return res.status(200).json({
            message: 'Recording is uploaded successfully',
            data: recording,
        });
    },
);

export const abortMultipartUploadController = asyncHandler(
    async (req: Request, res: Response) => {
        const meetingId = req.params.meetingId;
        const userId = req.user?.userId;

        const body = abortMultipartUploadSchema.parse(req.body);

        const result = await abortMultipartUploadService(
            body,
            meetingId as string,
            userId as string,
        );

        return res.status(200).json({
            message: 'Multipart upload aborted successfully',
            data: result,
        });
    },
);

export const listMultipartUploadPartsController = asyncHandler(
    async (req: Request, res: Response) => {
        const meetingId = req.params.meetingId;
        const userId = req.user?.userId;

        const query = listMultipartUploadPartsSchema.parse(req.query);

        const result = await listMultipartUploadPartsService(
            query,
            meetingId as string,
            userId as string,
        );

        return res.status(200).json({
            message: 'Multipart upload parts fetched successfully',
            data: result,
        });
    },
);

export const getMeetingStatusController = asyncHandler(
    async (req: Request, res: Response) => {
        const meetingId = req.params.meetingId as string;
        const userId = req.user!.userId;

        const status = await getMeetingStatusService(meetingId, userId);

        return res.status(HTTPSTATUS.OK).json({
            message: 'Meeting status fetched successfully',
            status,
        })
    }
);

export const getTranscriptController = asyncHandler(
    async (req: Request, res: Response) => {
        const { meetingId } = meetingIdParamSchema.parse(req.params);
        const userId = req.user!.userId;

        const transcript = await getTranscriptResultService(meetingId, userId);

        return res.status(HTTPSTATUS.OK).json({
            message: 'Transcript fetched successfully',
            transcript,
        });
    },
);

export const getSummaryController = asyncHandler(
    async (req: Request, res: Response) => {
        const { meetingId } = meetingIdParamSchema.parse(req.params);
        const userId = req.user!.userId;

        const summary = await getSummaryResultService(meetingId, userId);

        return res.status(HTTPSTATUS.OK).json({
            message: 'Summary fetched successfully',
            summary,
        });
    },
);

export const getIntelligenceController = asyncHandler(
    async (req: Request, res: Response) => {
        const { meetingId } = meetingIdParamSchema.parse(req.params);
        const userId = req.user!.userId;

        const intelligence = await getIntelligenceResultService(meetingId, userId);

        return res.status(HTTPSTATUS.OK).json({
            message: 'Intelligence fetched successfully',
            intelligence,
        });
    },
);

export const sendChatMessageController = asyncHandler(
    async (req: Request, res: Response) => {
        const { meetingId } = meetingIdParamSchema.parse(req.params);
        const { message } = sendChatMessageSchema.parse(req.body);
        const userId = req.user!.userId;

        const result = await askMeetingQuestionService(meetingId, userId, message);
        const messages = await getChatMessagesService(meetingId, userId);

        return res.status(HTTPSTATUS.OK).json({
            message: 'Chat response generated successfully',
            no_answer: result.answer.state === 'no-answer',
            state: result.answer.state,
            answer: result.answer.answer,
            citations: result.answer.citations,
            messages,
        });
    },
);

export const retryMeetingController = asyncHandler(
    async (req: Request, res: Response) => {
        const { meetingId } = meetingIdParamSchema.parse(req.params);
        const userId = req.user!.userId;

        const result = await retryMeetingService(meetingId, userId);

        return res.status(HTTPSTATUS.OK).json({
            message: 'Meeting retry queued successfully',
            result,
        });
    },
);

export const updateMeetingTypeController = asyncHandler(
    async (req: Request, res: Response) => {
        const { meetingId } = meetingIdParamSchema.parse(req.params);
        const body = updateMeetingTypeSchema.parse(req.body);
        const userId = req.user!.userId;

        const result = await updateMeetingTypeService(body, meetingId, userId);

        return res.status(HTTPSTATUS.OK).json({
            message: 'Meeting type updated and rebuild queued successfully',
            result,
        });
    },
);