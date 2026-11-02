import { Router } from 'express';
import { tagController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(tagController.findAll));
router.get('/:id', asyncHandler(tagController.findById));

router.post('/', authenticate, authorize('create:tag'), asyncHandler(tagController.create));
router.patch('/:id', authenticate, authorize('update:tag'), asyncHandler(tagController.update));
router.delete('/:id', authenticate, authorize('delete:tag'), asyncHandler(tagController.remove));

export default router;
