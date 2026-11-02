import { Router } from 'express';
import { placeController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(placeController.findAll));
router.get('/attractions', asyncHandler(placeController.findAttractions));
router.get('/slug/:slug', asyncHandler(placeController.findPublicBySlug));
router.get('/:id', asyncHandler(placeController.findById));

router.post('/', authenticate, authorize('create:place'), asyncHandler(placeController.create));
router.patch('/:id', authenticate, authorize('update:place'), asyncHandler(placeController.update));
router.delete('/:id', authenticate, authorize('delete:place'), asyncHandler(placeController.remove));

export default router;
