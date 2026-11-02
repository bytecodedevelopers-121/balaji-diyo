import { Router } from 'express';
import { serviceController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/public', asyncHandler(serviceController.findPublic));
router.get('/section-config', authenticate, authorize('read:service'), asyncHandler(serviceController.findSectionConfig));
router.patch(
  '/section-config',
  authenticate,
  authorize('update:service'),
  asyncHandler(serviceController.updateSectionConfig),
);
router.get('/', authenticate, authorize('read:service'), asyncHandler(serviceController.findAll));
router.get('/:id', authenticate, authorize('read:service'), asyncHandler(serviceController.findById));
router.post('/', authenticate, authorize('create:service'), asyncHandler(serviceController.create));
router.patch('/:id', authenticate, authorize('update:service'), asyncHandler(serviceController.update));
router.delete('/:id', authenticate, authorize('delete:service'), asyncHandler(serviceController.remove));

export default router;
