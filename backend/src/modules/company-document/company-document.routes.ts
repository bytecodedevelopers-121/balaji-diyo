import { Router } from 'express';
import { companyDocumentController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(companyDocumentController.findAll));
router.get('/:id', asyncHandler(companyDocumentController.findById));

router.post('/', authenticate, authorize('create:document'), asyncHandler(companyDocumentController.create));
router.patch('/:id', authenticate, authorize('update:document'), asyncHandler(companyDocumentController.update));
router.delete('/:id', authenticate, authorize('delete:document'), asyncHandler(companyDocumentController.remove));

export default router;
