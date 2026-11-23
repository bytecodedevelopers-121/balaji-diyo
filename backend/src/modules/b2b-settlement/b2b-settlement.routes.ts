import { Router } from 'express';
import { b2bSettlementController, b2bSettlementAdminController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import { partnerOperational, requireInternalStaff } from '../../common/guards/b2b.guard';
import asyncHandler from '../../common/utils/asyncHandler';

// Partner — mounted at /api/b2b. Finance data: agency admins and finance managers only.
export const partnerSettlementRoutes = Router();
partnerSettlementRoutes.get('/settlements/summary', ...partnerOperational('AGENCY_ADMIN', 'FINANCE_MANAGER'), asyncHandler(b2bSettlementController.summary));
partnerSettlementRoutes.get('/settlements/export', ...partnerOperational('AGENCY_ADMIN', 'FINANCE_MANAGER'), asyncHandler(b2bSettlementController.export));

// Internal — mounted at /api/admin/b2b
export const adminSettlementRoutes = Router();
adminSettlementRoutes.get('/settlements', authenticate, requireInternalStaff, authorize('read:b2b_finance'), asyncHandler(b2bSettlementAdminController.list));
adminSettlementRoutes.post('/partners/:id/settlements', authenticate, requireInternalStaff, authorize('update:b2b_finance'), asyncHandler(b2bSettlementAdminController.record));
