import { Router } from 'express';
import { blogController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Public — consumed by the frontend site, always isActive-only.
router.get('/', asyncHandler(blogController.findAllPublic));

router.get('/admin/all', authenticate, authorize('read:blog'), asyncHandler(blogController.findAllAdmin));
router.get('/admin/:id', authenticate, authorize('read:blog'), asyncHandler(blogController.findById));

router.post('/', authenticate, authorize('create:blog'), asyncHandler(blogController.create));

router.get('/:slug', asyncHandler(blogController.findPublicBySlug));

router.patch('/:id', authenticate, authorize('update:blog'), asyncHandler(blogController.update));
router.delete('/:id', authenticate, authorize('delete:blog'), asyncHandler(blogController.remove));
router.post('/:id/restore', authenticate, authorize('update:blog'), asyncHandler(blogController.restore));
router.delete('/:id/permanent', authenticate, authorize('delete:blog'), asyncHandler(blogController.hardDelete));

export default router;
