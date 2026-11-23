import { Router } from 'express';
import { b2bSlaController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import { partnerOperational, requireInternalStaff } from '../../common/guards/b2b.guard';
import asyncHandler from '../../common/utils/asyncHandler';

// Partner — mounted at /api/b2b
export const partnerSlaRoutes = Router();
partnerSlaRoutes.get('/sla-tickets', ...partnerOperational(), asyncHandler(b2bSlaController.listMine));

// Internal — mounted at /api/admin/b2b
export const adminSlaRoutes = Router();
adminSlaRoutes.get('/sla-tickets', authenticate, requireInternalStaff, authorize('read:b2b_sla'), asyncHandler(b2bSlaController.listAdmin));
adminSlaRoutes.patch('/sla-tickets/:id', authenticate, requireInternalStaff, authorize('update:b2b_sla'), asyncHandler(b2bSlaController.update));
