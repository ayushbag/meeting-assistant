import { Router, type Router as RouterType } from 'express';
import {
    registerUserController,
    loginUserController,
    logoutUserController,
    googleLoginController,
    googleCallbackController,
} from '../controller/auth.controller.js';

const authRoutes: RouterType = Router();

authRoutes.post('/register', registerUserController);
authRoutes.post('/login', loginUserController);
authRoutes.post('/logout', logoutUserController);

authRoutes.get('/google', googleLoginController);
authRoutes.get('/google/callback', googleCallbackController)

export default authRoutes;
