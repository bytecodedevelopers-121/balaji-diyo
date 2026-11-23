import { Router } from 'express';
import { b2bAdminController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import { requireInternalStaff } from '../../common/guards/b2b.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Internal staff only (partner-bound accounts are refused here AND in `authenticate`),
// then the usual permission check.
router.use(authenticate, requireInternalStaff);

router.get('/partners', authorize('read:b2b_partner'), asyncHandler(b2bAdminController.listPartners));
router.get('/partners/:id', authorize('read:b2b_partner'), asyncHandler(b2bAdminController.getPartner));
router.get('/partners/:id/kyc-documents/:docId/file', authorize('read:b2b_partner'), asyncHandler(b2bAdminController.downloadKycDocument));
router.patch('/partners/:id/kyc', authorize('update:b2b_partner'), asyncHandler(b2bAdminController.reviewKyc));
router.patch('/partners/:id/decision', authorize('update:b2b_partner'), asyncHandler(b2bAdminController.decide));

router.get('/tiers', authorize('read:b2b_tier'), asyncHandler(b2bAdminController.listTiers));
router.post('/tiers', authorize('create:b2b_tier'), asyncHandler(b2bAdminController.createTier));
router.patch('/tiers/:id', authorize('update:b2b_tier'), asyncHandler(b2bAdminController.updateTier));

export default router;
