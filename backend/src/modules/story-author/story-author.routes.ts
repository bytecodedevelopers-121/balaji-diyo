import { Router } from 'express';
import { storyAuthorController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(storyAuthorController.findAll));
router.get('/:id', asyncHandler(storyAuthorController.findById));

router.post('/', authenticate, authorize('create:travel'), asyncHandler(storyAuthorController.create));
router.patch('/:id', authenticate, authorize('update:travel'), asyncHandler(storyAuthorController.update));
router.delete('/:id', authenticate, authorize('delete:travel'), asyncHandler(storyAuthorController.remove));

export default router;
