import jwt from 'jsonwebtoken';
import { env } from '../config/app.config.js';
import { logger } from '@repo/logger';
import type { CookieOptions, Response } from 'express';

export type JwtPayload = {
    userId: string;
    email: string;
};

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

const accessTokenCookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
};

const refreshTokenCookieOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
};

/**
 * Sign an access token (short-lived, 15 min).
 */
export const signAccessToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
};

/**
 * Sign a refresh token (long-lived, 7 days).
 */
export const signRefreshToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });
};

/**
 * Verify and decode an access token.
 * Returns the payload or throws if invalid/expired.
 */
export const verifyAccessToken = (token: string): JwtPayload => {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

/**
 * Verify and decode a refresh token.
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};

/**
 * Set both tokens as httpOnly cookies on the response.
 */
export const setAuthCookies = (res: Response, payload: JwtPayload) => {
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.cookie('accessToken', accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

    logger.info(
        { userId: payload.userId },
        'Auth cookies set for user',
    );
};

/**
 * Clear auth cookies (log out).
 */
export const clearAuthCookies = (res: Response) => {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
};
