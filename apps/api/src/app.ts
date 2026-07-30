import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { env } from './config/app.config.js';
import authRoutes from './routes/auth.routes.js';
import { meetingRoutes } from './routes/meeting.routes.js';
import { authenticate } from './middlewares/auth.middleware.js';

export const app: Express = express();
const BASE_PATH = env.BASE_PATH;

// parse incoming JSON and URL encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// parse cookies (needed for JWT auth middleware)
app.use(cookieParser());

// enable CORS for frontend origin
app.use(
    cors({
        origin: env.FRONTEND_ORIGIN,
        credentials: true,
    }),
);

// health endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        message: 'healthy',
    });
});

// API routes
app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/meetings`, authenticate, meetingRoutes);

// centralised error handling
app.use(errorHandler);