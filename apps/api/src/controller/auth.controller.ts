import type { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { HTTPSTATUS } from '../config/http.config.js';
import { registerSchema, loginSchema } from '../validation/auth.validation.js';
import {
    registerUserService,
    loginUserService,
    googleCallbackService,
    googleLoginService,
    refreshTokenService,
} from '../service/auth.service.js';
import { setAuthCookies, clearAuthCookies } from '../utils/jwt.js';
import { BadRequestException } from '../utils/app-error.js';
import { ErrorCodeEnum } from '../enums/error-code.enum.js';
import { env } from '../config/app.config.js';

/**
 * POST /auth/register
 * Register a new user and set auth cookies.
 */
export const registerUserController = asyncHandler(async (req: Request, res: Response) => {
    const body = registerSchema.parse(req.body);

    const { user, accessToken, refreshToken } = await registerUserService(body);

    // Set httpOnly cookies
    setAuthCookies(res, { userId: user.id, email: user.email });

    return res.status(HTTPSTATUS.CREATED).json({
        message: 'User created successfully',
        user,
        accessToken,
        refreshToken,
    });
});

/**
 * POST /auth/login
 * Authenticate an existing user and set auth cookies.
 */
export const loginUserController = asyncHandler(async (req: Request, res: Response) => {
    const body = loginSchema.parse(req.body);

    const { user, accessToken, refreshToken } = await loginUserService(body);

    // Set httpOnly cookies
    setAuthCookies(res, { userId: user.id, email: user.email });

    return res.status(HTTPSTATUS.OK).json({
        message: 'Login successful',
        user,
        accessToken,
        refreshToken,
    });
});

/**
 * POST /auth/logout
 * Clear auth cookies to log out the user.
 */
export const logoutUserController = asyncHandler(async (_req: Request, res: Response) => {
    clearAuthCookies(res);

    return res.status(HTTPSTATUS.OK).json({
        message: 'Logged out successfully',
    });
});

/**
 * GET /auth/google
 * Login with google
 */
export const googleLoginController = asyncHandler(async (req: Request, res: Response) => {
    const { url, state } = await googleLoginService();

    // Store state in a cookie for CSRF verification on callback
    res.cookie('googleOAuthState', state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        maxAge: 5 * 60 * 1000, // 5 minutes (matches the OAuth flow timeout)
        path: '/',
    });

    return res.redirect(url);
});

/**
 * GET /auth/google/callback
 * Handle Google OAuth callback
 */
export const googleCallbackController = asyncHandler(async (req: Request, res: Response) => {
    // Handle OAuth error (e.g., user denied consent, access_denied)
    if (req.query.error) {
        // Clean up the state cookie even on failure
        res.clearCookie('googleOAuthState', { path: '/' });

        const error = typeof req.query.error === 'string' ? req.query.error : 'unknown_error';
        return res.redirect(`${env.FRONTEND_ORIGIN}/login?error=${encodeURIComponent(error)}`);
    }

    // Safely extract the authorization code (guard against array/object query values)
    const queryCode = req.query.code;
    const code = typeof queryCode === 'string' ? queryCode : undefined;

    if (!code) {
        throw new BadRequestException(
            'Authorization code is missing',
            ErrorCodeEnum.AUTH_INVALID_TOKEN,
        );
    }

    // Verify CSRF state to prevent OAuth callback forgery
    const storedState = req.cookies?.googleOAuthState;
    const returnedState = req.query.state;
    const expectedState = typeof returnedState === 'string' ? returnedState : undefined;

    if (!storedState || !expectedState || storedState !== expectedState) {
        throw new BadRequestException(
            'Invalid OAuth state. Possible CSRF attack.',
            ErrorCodeEnum.AUTH_INVALID_TOKEN,
        );
    }

    // Clear the state cookie after successful verification
    res.clearCookie('googleOAuthState', { path: '/' });

    const { user } = await googleCallbackService(code);

    setAuthCookies(res, { userId: user.id, email: user.email });

    return res.redirect(`${env.FRONTEND_ORIGIN}/dashboard`);
});

/**
 * POST /auth/refresh
 * Refreshes the access token using the refresh token.
 */
export const refreshTokenController = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    const payload = await refreshTokenService(refreshToken);

    setAuthCookies(res, payload);

    return res.status(200).json({
        message: "Access token refreshed successfully"
    })
})