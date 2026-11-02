import { Router } from 'express';
import { pageController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Public — consumed by frontend-user, always PUBLISHED-only
router.get('/', asyncHandler(pageController.findAllPublic));

router.get(
  '/admin/all',
  authenticate,
  authorize('read:page'),
  asyncHandler(pageController.findAllAdmin),
);
router.get(
  '/admin/:id',
  authenticate,
  authorize('read:page'),
  asyncHandler(pageController.findById),
);

router.post('/', authenticate, authorize('create:page'), asyncHandler(pageController.create));

router.get('/:slug', asyncHandler(pageController.findPublicBySlug));

router.patch('/:id', authenticate, authorize('update:page'), asyncHandler(pageController.update));
router.delete('/:id', authenticate, authorize('delete:page'), asyncHandler(pageController.remove));
router.post('/:id/restore', authenticate, authorize('update:page'), asyncHandler(pageController.restore));
router.delete('/:id/permanent', authenticate, authorize('delete:page'), asyncHandler(pageController.hardDelete));

export default router;
