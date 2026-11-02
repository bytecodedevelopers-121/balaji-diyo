import { Router } from 'express';
import { customBookingController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import { verifyCaptcha } from '../../common/guards/captcha.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Public — same rationale as /bookings (rate-limited globally and
// captcha-gated, see app.ts / captcha.guard.ts).
router.post('/', verifyCaptcha, asyncHandler(customBookingController.create));

router.get('/', authenticate, authorize('read:booking'), asyncHandler(customBookingController.findAll));
router.get('/:id', authenticate, authorize('read:booking'), asyncHandler(customBookingController.findById));

export default router;
