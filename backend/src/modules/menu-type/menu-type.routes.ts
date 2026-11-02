import { Router } from 'express';
import { menuTypeController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Admin-only lookup table — menu items reference it, no public read needed.
router.use(authenticate);

router.post('/', authorize('create:menu'), asyncHandler(menuTypeController.create));
router.get('/', authorize('read:menu'), asyncHandler(menuTypeController.findAll));
router.get('/:id', authorize('read:menu'), asyncHandler(menuTypeController.findById));
router.patch('/:id', authorize('update:menu'), asyncHandler(menuTypeController.update));
router.delete('/:id', authorize('delete:menu'), asyncHandler(menuTypeController.remove));
router.post('/:id/restore', authorize('update:menu'), asyncHandler(menuTypeController.restore));

export default router;
