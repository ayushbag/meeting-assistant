import crypto from 'node:crypto';
import z from 'zod';
import { registerSchema, loginSchema } from '../validation/auth.validation.js';
import { hashValue, comparePassword } from '../utils/bcrpyt.js';
import { prisma } from '@repo/db';
import {
    BadRequestException,
    UnauthorizedException,
} from '../utils/app-error.js';
import { ErrorCodeEnum } from '../enums/error-code.enum.js';
import {
    hashRefreshToken,
    REFRESH_TOKEN_TTL_MS,
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    type JwtPayload,
} from '../utils/jwt.js';
import { googleClient } from '../utils/google.js';
import { env } from '../config/app.config.js';

type AuthPayload = {
    userId: string;
    email: string;
};

type IssuedTokens = {
    accessToken: string;
    refreshToken: string;
};

/**
 * Issues a fresh access/refresh pair and stores only the refresh token hash
 * server-side. The raw refresh token lives in the httpOnly cookie only.
 */
const issueAuthSession = async (payload: AuthPayload): Promise<IssuedTokens> => {
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshSession.create({
        data: {
            userId: payload.userId,
            tokenHash: hashRefreshToken(refreshToken),
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
    });

    return { accessToken, refreshToken };
};

/**
 * Register a new user.
 * Checks for duplicate email, hashes the password, creates the user,
 * and returns signed tokens.
 */
export const registerUserService = async (body: z.infer<typeof registerSchema>) => {
    const { email, name, password } = body;

    // 1. Check for existing user to avoid duplicate registration
    const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    if (existingUser) {
        throw new BadRequestException(
            'A user with this email already exists.',
            ErrorCodeEnum.AUTH_EMAIL_ALREADY_EXISTS,
        );
    }

    // 2. Hash the password
    const passwordHash = await hashValue(password, 12);

    // 3. Create the user
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: passwordHash,
        },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
        },
    });

    // 4. Issue tokens and persist the refresh session
    const tokens = await issueAuthSession({ userId: user.id, email: user.email });

    return {
        user,
        ...tokens,
    };
};

/**
 * Authenticate an existing user.
 * Validates credentials and returns signed tokens.
 */
export const loginUserService = async (body: z.infer<typeof loginSchema>) => {
    const { email, password } = body;

    // 1. Find user by email
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new UnauthorizedException(
            'Invalid email or password.',
            ErrorCodeEnum.AUTH_USER_NOT_FOUND,
        );
    }

    // 2. Verify password. Google-only accounts have no local password.
    if (!user.password) {
        throw new UnauthorizedException(
            'This account uses Google Sign-In. Please sign in with Google.',
            ErrorCodeEnum.AUTH_UNAUTHORIZED_ACCESS,
        );
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        throw new UnauthorizedException(
            'Invalid email or password.',
            ErrorCodeEnum.ACCESS_UNAUTHORIZED,
        );
    }

    // 3. Issue tokens and persist the refresh session
    const tokens = await issueAuthSession({ userId: user.id, email: user.email });

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        },
        ...tokens,
    };
};

/**
 * Authenticate using google
 */
export const googleLoginService = () => {
    const state = crypto.randomBytes(32).toString('hex');

    const url = googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['openid', 'email', 'profile'],
        state,
    });

    return { url, state };
};

type GoogleUserData = {
    googleId: string;
    email: string;
    name: string;
    avatar: string;
};

/**
 * Find an existing user by email, or create a new one from Google data.
 * If a user exists but hasn't linked their Google account, link it.
 */
export const findOrCreateExistingUser = async (googleUser: GoogleUserData) => {
    const existingUser = await prisma.user.findUnique({
        where: { email: googleUser.email },
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            googleId: true,
            avatar: true,
            isEmailVerified: true,
        },
    });

    if (!existingUser) {
        return prisma.user.create({
            data: {
                email: googleUser.email,
                name: googleUser.name,
                avatar: googleUser.avatar,
                googleId: googleUser.googleId,
                isEmailVerified: true,
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                googleId: true,
                avatar: true,
                isEmailVerified: true,
            },
        });
    }

    // User exists but hasn't linked Google yet — link the account
    if (!existingUser.googleId) {
        return prisma.user.update({
            where: { id: existingUser.id },
            data: {
                googleId: googleUser.googleId,
                avatar: googleUser.avatar || existingUser.avatar,
                isEmailVerified: true,
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                googleId: true,
                avatar: true,
                isEmailVerified: true,
            },
        });
    }

    return existingUser;
};

/**
 * Authenticate using google callback
 */
export const googleCallbackService = async (code: string) => {
    // Exchange authorization code for tokens
    const { tokens: googleTokens } = await googleClient.getToken(code);

    if (!googleTokens.id_token) {
        throw new BadRequestException(
            'Google did not return an ID token',
            ErrorCodeEnum.AUTH_INVALID_TOKEN,
        );
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
        idToken: googleTokens.id_token,
        audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email) {
        throw new BadRequestException(
            'Failed to verify Google user identity',
            ErrorCodeEnum.AUTH_INVALID_TOKEN,
        );
    }

    if (!payload.email_verified) {
        throw new BadRequestException(
            'Google email is not verified. Please use a verified Google account.',
            ErrorCodeEnum.AUTH_UNAUTHORIZED_ACCESS,
        );
    }

    // Find or create user from Google profile
    const user = await findOrCreateExistingUser({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name ?? '',
        avatar: payload.picture ?? '',
    });

    const authTokens = await issueAuthSession({
        userId: user.id,
        email: user.email,
    });

    return {
        user,
        ...authTokens,
    };
};

const revokeAllUserSessions = async (userId: string) => {
    await prisma.refreshSession.updateMany({
        where: {
            userId,
            revokedAt: null,
        },
        data: {
            revokedAt: new Date(),
        },
    });
};

/**
 * Rotate a refresh token. Reuse of an already-rotated token revokes every
 * session for that user, which limits the blast radius of a stolen token.
 */
export const refreshTokenService = async (token: string) => {
    let payload: JwtPayload;
    try {
        payload = verifyRefreshToken(token);
    } catch {
        throw new UnauthorizedException('Invalid refresh token', ErrorCodeEnum.AUTH_INVALID_TOKEN);
    }

    const user = await prisma.user.findUnique({
        where: {
            id: payload.userId,
        },
        select: {
            id: true,
            email: true,
        },
    });

    if (!user || user.email !== payload.email) {
        throw new UnauthorizedException('Invalid refresh token', ErrorCodeEnum.AUTH_INVALID_TOKEN);
    }

    const tokenHash = hashRefreshToken(token);
    const session = await prisma.refreshSession.findUnique({
        where: { tokenHash },
    });

    if (!session || session.userId !== user.id) {
        throw new UnauthorizedException('Invalid refresh token', ErrorCodeEnum.AUTH_INVALID_TOKEN);
    }

    if (session.revokedAt || session.expiresAt <= new Date()) {
        await revokeAllUserSessions(user.id);
        throw new UnauthorizedException('Invalid refresh token', ErrorCodeEnum.AUTH_INVALID_TOKEN);
    }

    const rotated = await prisma.refreshSession.updateMany({
        where: {
            id: session.id,
            revokedAt: null,
        },
        data: {
            revokedAt: new Date(),
        },
    });

    if (rotated.count !== 1) {
        // Another request already rotated this token: treat it as reuse.
        await revokeAllUserSessions(user.id);
        throw new UnauthorizedException('Invalid refresh token', ErrorCodeEnum.AUTH_INVALID_TOKEN);
    }

    const tokens = await issueAuthSession({ userId: user.id, email: user.email });

    return {
        userId: user.id,
        email: user.email,
        ...tokens,
    };
};

/**
 * Revoke the refresh session backing the current logout request.
 * Logout stays idempotent: missing or malformed cookies are ignored.
 */
export const logoutUserService = async (token?: string) => {
    if (!token) return;

    await prisma.refreshSession.updateMany({
        where: {
            tokenHash: hashRefreshToken(token),
            revokedAt: null,
        },
        data: {
            revokedAt: new Date(),
        },
    });
};
