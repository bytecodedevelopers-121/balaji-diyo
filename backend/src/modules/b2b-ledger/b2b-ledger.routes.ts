import { Router } from 'express';
import { b2bWalletController, b2bLedgerAdminController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import { partnerOperational, requireInternalStaff } from '../../common/guards/b2b.guard';
import asyncHandler from '../../common/utils/asyncHandler';

// Partner routes — mounted at /api/b2b. Guards are per-route (the prefix also hosts the public registration route).
export const partnerWalletRoutes = Router();
partnerWalletRoutes.get('/wallet/summary', ...partnerOperational(), asyncHandler(b2bWalletController.summary));
partnerWalletRoutes.get('/ledger', ...partnerOperational('AGENCY_ADMIN', 'FINANCE_MANAGER'), asyncHandler(b2bWalletController.ledger));
partnerWalletRoutes.post('/wallet/topup/initiate', ...partnerOperational('AGENCY_ADMIN', 'FINANCE_MANAGER'), asyncHandler(b2bWalletController.initiateTopUp));

// Internal routes — mounted at /api/admin/b2b
export const adminLedgerRoutes = Router();
adminLedgerRoutes.get('/partners/:id/wallet', authenticate, requireInternalStaff, authorize('read:b2b_finance'), asyncHandler(b2bLedgerAdminController.summary));
adminLedgerRoutes.get('/partners/:id/ledger', authenticate, requireInternalStaff, authorize('read:b2b_finance'), asyncHandler(b2bLedgerAdminController.ledger_));
adminLedgerRoutes.post('/partners/:id/ledger-adjustment', authenticate, requireInternalStaff, authorize('update:b2b_finance'), asyncHandler(b2bLedgerAdminController.adjust));
