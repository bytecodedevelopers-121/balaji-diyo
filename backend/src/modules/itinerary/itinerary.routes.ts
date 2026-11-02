import { Router } from 'express';
import { itineraryController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/package/:packageId', asyncHandler(itineraryController.findByPackageId));
router.get('/:id', asyncHandler(itineraryController.findById));

router.post('/', authenticate, authorize('create:travel'), asyncHandler(itineraryController.create));
router.patch('/:id', authenticate, authorize('update:travel'), asyncHandler(itineraryController.update));
router.delete('/:id', authenticate, authorize('delete:travel'), asyncHandler(itineraryController.remove));

export default router;
