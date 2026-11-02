import { Router } from 'express';
import { authController } from '../../config/container';
import asyncHandler from '../../common/utils/asyncHandler';
import { authenticate } from '../../common/guards/jwt.guard';

const router = Router();

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', asyncHandler(authController.logout));

router.get('/me', authenticate, asyncHandler(authController.me));

export default router;