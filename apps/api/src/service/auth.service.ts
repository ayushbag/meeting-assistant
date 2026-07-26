import crypto from 'node:crypto';
import z from 'zod';
import { registerSchema, loginSchema } from '../validation/auth.validation.js';
import { hashValue, comparePassword } from '../utils/bcrpyt.js';
import { prisma } from '@repo/db';
import { BadRequestException, UnauthorizedException } from '../utils/app-error.js';
import { ErrorCodeEnum } from '../enums/error-code.enum.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import { googleClient } from '../utils/google.js';
import { env } from '../config/app.config.js';

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

    // 4. Sign tokens
    const payload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return {
        user,
        accessToken,
        refreshToken,
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

    // 2. Verify password
    const isPasswordValid = await comparePassword(password, user.password!);
    if (!isPasswordValid) {
        throw new UnauthorizedException(
            'Invalid email or password.',
            ErrorCodeEnum.ACCESS_UNAUTHORIZED,
        );
    }

    // 3. Sign tokens
    const payload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
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
    const { tokens } = await googleClient.getToken(code);

    if (!tokens.id_token) {
        throw new BadRequestException(
            'Google did not return an ID token',
            ErrorCodeEnum.AUTH_INVALID_TOKEN,
        );
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
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

    return {
        user
    };
};
