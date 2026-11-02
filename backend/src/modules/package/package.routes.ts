import { Router } from 'express';
import { packageController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(packageController.findAllPublic));

router.get('/admin/all', authenticate, authorize('read:travel'), asyncHandler(packageController.findAllAdmin));
router.get('/admin/:id', authenticate, authorize('read:travel'), asyncHandler(packageController.findById));

router.post('/', authenticate, authorize('create:travel'), asyncHandler(packageController.create));

router.patch('/reorder', authenticate, authorize('update:travel'), asyncHandler(packageController.reorder));
router.patch('/category/:categoryId/reorder', authenticate, authorize('update:travel'), asyncHandler(packageController.reorderInCategory));
router.patch('/reorder-popular', authenticate, authorize('update:travel'), asyncHandler(packageController.reorderPopular));

router.get('/:slug', asyncHandler(packageController.findPublicBySlug));

router.patch('/:id', authenticate, authorize('update:travel'), asyncHandler(packageController.update));
router.delete('/:id', authenticate, authorize('delete:travel'), asyncHandler(packageController.remove));
router.post('/:id/restore', authenticate, authorize('update:travel'), asyncHandler(packageController.restore));
router.delete('/:id/permanent', authenticate, authorize('delete:travel'), asyncHandler(packageController.hardDelete));

export default router;
