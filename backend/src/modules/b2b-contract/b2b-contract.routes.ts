import { Router } from 'express';
import { b2bContractController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import { requireInternalStaff } from '../../common/guards/b2b.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/contracts', authenticate, requireInternalStaff, authorize('read:b2b_contract'), asyncHandler(b2bContractController.list));
router.post('/contracts', authenticate, requireInternalStaff, authorize('create:b2b_contract'), asyncHandler(b2bContractController.create));
router.patch('/contracts/:id', authenticate, requireInternalStaff, authorize('update:b2b_contract'), asyncHandler(b2bContractController.update));

export default router;
