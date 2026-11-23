import { Router } from 'express';
import { b2bPricingController } from '../../config/container';
import { partnerOperational } from '../../common/guards/b2b.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Guards are per-route on purpose: this router shares the /b2b prefix with the public registration route.
router.post('/pricing/quote', ...partnerOperational(), asyncHandler(b2bPricingController.quote));

export default router;
