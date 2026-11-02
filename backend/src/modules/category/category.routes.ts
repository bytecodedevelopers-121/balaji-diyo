import { Router } from 'express';
import { categoryController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Public — the frontend site renders category-filtered listings (blog, team, packages).
router.get('/', asyncHandler(categoryController.findAll));
router.get('/tree/:typeId', asyncHandler(categoryController.findTree));
router.get('/slug/:slug', asyncHandler(categoryController.findPublicBySlug));
router.get('/:id', asyncHandler(categoryController.findById));

router.post('/', authenticate, authorize('create:category'), asyncHandler(categoryController.create));
router.patch('/:id', authenticate, authorize('update:category'), asyncHandler(categoryController.update));
router.delete('/:id', authenticate, authorize('delete:category'), asyncHandler(categoryController.remove));
router.post('/:id/restore', authenticate, authorize('update:category'), asyncHandler(categoryController.restore));
router.delete('/:id/permanent', authenticate, authorize('delete:category'), asyncHandler(categoryController.hardDelete));
router.post('/bulk/delete', authenticate, authorize('delete:category'), asyncHandler(categoryController.bulkRemove));

export default router;
