import { Router } from 'express';
import { analyticsController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get(
  '/dashboard',
  authenticate,
  authorize('read:analytics'),
  asyncHandler(analyticsController.getDashboard),
);

export default router;
