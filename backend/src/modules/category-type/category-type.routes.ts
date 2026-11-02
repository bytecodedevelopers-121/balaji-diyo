import { Router } from 'express';
import { categoryTypeController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Admin-only lookup table — categories reference it, no public read needed.
router.use(authenticate);

router.post('/', authorize('create:category'), asyncHandler(categoryTypeController.create));
router.get('/', authorize('read:category'), asyncHandler(categoryTypeController.findAll));
router.get('/:id', authorize('read:category'), asyncHandler(categoryTypeController.findById));
router.patch('/:id', authorize('update:category'), asyncHandler(categoryTypeController.update));
router.delete('/:id', authorize('delete:category'), asyncHandler(categoryTypeController.remove));
router.post('/:id/restore', authorize('update:category'), asyncHandler(categoryTypeController.restore));

export default router;
