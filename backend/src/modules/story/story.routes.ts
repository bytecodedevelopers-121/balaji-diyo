import { Router } from 'express';
import { storyController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(storyController.findAllPublic));

router.get('/admin/all', authenticate, authorize('read:travel'), asyncHandler(storyController.findAllAdmin));
router.get('/admin/:id', authenticate, authorize('read:travel'), asyncHandler(storyController.findById));

router.post('/', authenticate, authorize('create:travel'), asyncHandler(storyController.create));

router.get('/:slug', asyncHandler(storyController.findPublicBySlug));

router.patch('/:id', authenticate, authorize('update:travel'), asyncHandler(storyController.update));
router.delete('/:id', authenticate, authorize('delete:travel'), asyncHandler(storyController.remove));
router.post('/:id/restore', authenticate, authorize('update:travel'), asyncHandler(storyController.restore));
router.delete('/:id/permanent', authenticate, authorize('delete:travel'), asyncHandler(storyController.hardDelete));

export default router;
