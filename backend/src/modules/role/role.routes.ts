// src/modules/role/role.routes.ts
import { Router } from 'express';
import { roleController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import asyncHandler from '../../common/utils/asyncHandler';
import { authorize } from '../../common/guards/permission.guard';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('role:create'),
  asyncHandler(roleController.create)
);

router.get(
  '/',
  authenticate,
  authorize('role:read'),
  asyncHandler(roleController.findAll)
);

// Must come before '/:id' so it isn't swallowed by the param route.
router.get(
  '/permissions',
  authenticate,
  asyncHandler(roleController.getPermissions)
);

router.get(
  '/:id',
  authenticate,
  authorize('role:read'),
  asyncHandler(roleController.findById)
);

router.patch(
  '/:id',
  authenticate,
  authorize('role:update'),
  asyncHandler(roleController.update)
);

export default router;