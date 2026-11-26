import type { ErrorRequestHandler, Response } from 'express';
import { logger } from '@repo/logger';
import { ZodError } from 'zod';
import { HTTPSTATUS } from '../config/http.config.js';
import { AppError } from '../utils/app-error.js';
import { ErrorCodeEnum } from '../enums/error-code.enum.js';

export const formatZodError = (res: Response, error: ZodError) => {
    const errors = error?.issues?.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
    }));

    return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: 'Validation failed',
        error: errors,
        errorCode: ErrorCodeEnum.VALIDATION_ERROR,
    });
};

export const errorHandler: ErrorRequestHandler = (error, req, res, next): void => {
    // Express requires four parameters to recognise this as an error handler.
    void next;

    // Internal details stay in logs; clients only receive stable envelopes.
    logger.error({ err: error, path: req.path }, 'Request failed');

    if (error instanceof SyntaxError) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({
            message: 'Invalid JSON format. Please check your request body.',
            errorCode: ErrorCodeEnum.VALIDATION_ERROR,
        });
        return;
    }

    if (error instanceof ZodError) {
        formatZodError(res, error);
        return;
    }

    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            message: error.message,
            errorCode: error.errorCode,
        });
        return;
    }

    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Internal Server Error',
        errorCode: ErrorCodeEnum.INTERNAL_SERVER_ERROR,
    });
};
