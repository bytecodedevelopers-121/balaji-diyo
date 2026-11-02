import { Router } from 'express';
import { galleryAlbumController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(galleryAlbumController.findAll));
router.get('/showcase', asyncHandler(galleryAlbumController.findShowcase));
router.get('/slug/:slug', asyncHandler(galleryAlbumController.findPublicBySlug));
router.get('/:id', asyncHandler(galleryAlbumController.findById));

router.post('/', authenticate, authorize('create:gallery'), asyncHandler(galleryAlbumController.create));
router.patch('/:id', authenticate, authorize('update:gallery'), asyncHandler(galleryAlbumController.update));
router.delete('/:id', authenticate, authorize('delete:gallery'), asyncHandler(galleryAlbumController.remove));

export default router;
