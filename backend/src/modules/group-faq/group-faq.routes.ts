import { Router } from 'express';
import { groupFaqController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(groupFaqController.findAll));
router.get('/:id', asyncHandler(groupFaqController.findById));

// Shares the `faq` permission subject with the plain FAQ module.
router.post('/', authenticate, authorize('create:faq'), asyncHandler(groupFaqController.create));
router.patch('/:id', authenticate, authorize('update:faq'), asyncHandler(groupFaqController.update));
router.delete('/:id', authenticate, authorize('delete:faq'), asyncHandler(groupFaqController.remove));

export default router;
