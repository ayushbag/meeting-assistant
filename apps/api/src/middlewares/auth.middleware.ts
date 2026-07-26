import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedException } from '../utils/app-error.js';
import { ErrorCodeEnum } from '../enums/error-code.enum.js';

/**
 * Middleware that authenticates requests via the accessToken cookie.
 * On success, attaches the decoded payload to `req.user`.
 * The `user` property type is declared in @types/index.d.ts.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken;

    if (!token) {
        throw new UnauthorizedException(
            'Authentication required. No token provided.',
            ErrorCodeEnum.AUTH_TOKEN_NOT_FOUND,
        );
    }

    try {
        const payload = verifyAccessToken(token);
        req.user = payload;
        next();
    } catch (error) {
        throw new UnauthorizedException(
            'Invalid or expired token.',
            ErrorCodeEnum.AUTH_INVALID_TOKEN,
        );
    }
};
