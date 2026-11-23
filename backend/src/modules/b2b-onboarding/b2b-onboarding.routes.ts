import { Router } from 'express';
import { b2bOnboardingController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { requirePartnerUser, requireB2BRole } from '../../common/guards/b2b.guard';
import asyncHandler from '../../common/utils/asyncHandler';
import { uploadKyc } from '../../config/multer';
import { b2bRegisterLimiter } from '../../config/rate-limit';

const router = Router();

// Public — creates a PENDING_KYC partner + its AGENCY_ADMIN user. multipart/form-data
// (files in `documents`, parallel `docTypes` fields) or plain JSON without files.
router.post('/onboarding/register', b2bRegisterLimiter, uploadKyc.array('documents'), asyncHandler(b2bOnboardingController.register));

// Partner-scoped. Deliberately NOT behind requireActivePartner: PENDING_KYC /
// REJECTED agencies must be able to see their status and (re)submit KYC.
router.get('/partner/me', authenticate, requirePartnerUser, asyncHandler(b2bOnboardingController.me));
router.post(
  '/onboarding/kyc-documents',
  authenticate, requirePartnerUser, requireB2BRole('AGENCY_ADMIN'),
  uploadKyc.array('documents'),
  asyncHandler(b2bOnboardingController.uploadKycDocuments),
);
router.get(
  '/kyc-documents/:docId/file',
  authenticate, requirePartnerUser, requireB2BRole('AGENCY_ADMIN'),
  asyncHandler(b2bOnboardingController.downloadKycDocument),
);

export default router;
