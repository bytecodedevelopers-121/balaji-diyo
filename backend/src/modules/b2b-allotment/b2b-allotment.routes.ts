import { Router } from 'express';
import { b2bAllotmentController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import { requireInternalStaff } from '../../common/guards/b2b.guard';
import asyncHandler from '../../common/utils/asyncHandler';

// Mounted at /api/admin/b2b
const router = Router();
router.get('/allotments', authenticate, requireInternalStaff, authorize('read:b2b_allotment'), asyncHandler(b2bAllotmentController.list));
router.put('/allotments', authenticate, requireInternalStaff, authorize('update:b2b_allotment'), asyncHandler(b2bAllotmentController.upsert));

// Mounted at /api/admin/departures
export const departureCapacityRoutes = Router();
departureCapacityRoutes.patch('/:id/capacity', authenticate, requireInternalStaff, authorize('update:travel'), asyncHandler(b2bAllotmentController.setCapacity));

export default router;
