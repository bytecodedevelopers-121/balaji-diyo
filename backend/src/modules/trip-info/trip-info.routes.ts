import { Router } from 'express';
import { tripInfoController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(tripInfoController.findAll));
router.get('/:id', asyncHandler(tripInfoController.findById));

// Shares the `travel` permission subject with the rest of the Travel domain
// (Package, Departure, Itinerary, Story) — mirrors how the legacy admin
// grouped these under one "Travel" section.
router.post('/', authenticate, authorize('create:travel'), asyncHandler(tripInfoController.create));
router.patch('/:id', authenticate, authorize('update:travel'), asyncHandler(tripInfoController.update));
router.delete('/:id', authenticate, authorize('delete:travel'), asyncHandler(tripInfoController.remove));

export default router;
