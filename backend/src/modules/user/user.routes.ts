// src/modules/user/user.routes.ts
import { Router } from 'express';
import { userController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Self — must be registered before the /:id routes below
router.get('/me/profile', authenticate, asyncHandler(userController.getProfile));
router.patch('/me/profile', authenticate, asyncHandler(userController.updateProfile));
router.patch('/me/password', authenticate, asyncHandler(userController.changePassword));

// SuperAdmin only
router.post('/', authenticate, asyncHandler(userController.create));
router.get('/deleted', authenticate, asyncHandler(userController.getDeleted));
router.get('/', authenticate, asyncHandler(userController.findAll));

// Merchant-scoped / superAdmin
router.get('/:id', authenticate, authorize('read:user'), asyncHandler(userController.findById));
router.patch('/:id', authenticate, authorize('update:user'), asyncHandler(userController.update));
router.patch('/:id/activate', authenticate, authorize('update:user'), asyncHandler(userController.activate));
router.patch('/:id/deactivate', authenticate, authorize('update:user'), asyncHandler(userController.deactivate));
router.patch('/:id/reset-password', authenticate, authorize('update:user'), asyncHandler(userController.resetPassword));
router.patch('/:id/restore', authenticate, authorize('update:user'), asyncHandler(userController.restore));
router.delete('/:id', authenticate, authorize('delete:user'), asyncHandler(userController.remove));

export default router;
