import { Router } from 'express';
import { faqController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(faqController.findAll));
router.get('/:id', asyncHandler(faqController.findById));

router.post('/', authenticate, authorize('create:faq'), asyncHandler(faqController.create));
router.patch('/:id', authenticate, authorize('update:faq'), asyncHandler(faqController.update));
router.delete('/:id', authenticate, authorize('delete:faq'), asyncHandler(faqController.remove));
router.post('/bulk/delete', authenticate, authorize('delete:faq'), asyncHandler(faqController.bulkRemove));

export default router;
