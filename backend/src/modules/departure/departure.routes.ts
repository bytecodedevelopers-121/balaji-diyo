import { Router } from 'express';
import { departureController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(departureController.findAll));
router.get('/:id', asyncHandler(departureController.findById));

router.post('/', authenticate, authorize('create:travel'), asyncHandler(departureController.create));
router.post('/bulk', authenticate, authorize('create:travel'), asyncHandler(departureController.createBulk));
router.patch('/:id', authenticate, authorize('update:travel'), asyncHandler(departureController.update));
router.delete('/:id', authenticate, authorize('delete:travel'), asyncHandler(departureController.remove));

export default router;
