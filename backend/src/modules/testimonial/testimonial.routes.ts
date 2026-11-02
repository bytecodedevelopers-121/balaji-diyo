import { Router } from 'express';
import { testimonialController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(testimonialController.findAll));
router.get('/:id', asyncHandler(testimonialController.findById));

router.post('/', authenticate, authorize('create:testimonial'), asyncHandler(testimonialController.create));
router.patch('/:id', authenticate, authorize('update:testimonial'), asyncHandler(testimonialController.update));
router.delete('/:id', authenticate, authorize('delete:testimonial'), asyncHandler(testimonialController.remove));

export default router;
