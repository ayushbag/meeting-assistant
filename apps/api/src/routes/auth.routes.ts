import { Router, type Router as RouterType } from 'express';
import {
    registerUserController,
    loginUserController,
    logoutUserController,
    googleLoginController,
    googleCallbackController,
    refreshTokenController,
} from '../controller/auth.controller.js';

const authRoutes: RouterType = Router();

authRoutes.post('/register', registerUserController);
authRoutes.post('/login', loginUserController);
authRoutes.post('/logout', logoutUserController);

authRoutes.get('/google', googleLoginController);
authRoutes.get('/google/callback', googleCallbackController);

authRoutes.post('/refresh', refreshTokenController)

export default authRoutes;
