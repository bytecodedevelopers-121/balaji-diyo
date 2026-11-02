import { Router } from 'express';
import { bookingController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import { verifyCaptcha } from '../../common/guards/captcha.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Public — the booking form and the traveller-info follow-up link are both
// unauthenticated on the legacy site (rate-limited globally, see app.ts;
// the initial booking submission is also captcha-gated, see
// captcha.guard.ts — the traveller follow-up isn't, it's reached from an
// email link rather than a raw public form).
// Traveller submission being public (vs. scoped to a one-time link token) is
// a straight port of that assumption — revisit once the dump/real auth
// mechanism for the public site is confirmed.
router.post('/', verifyCaptcha, asyncHandler(bookingController.create));
router.post('/:id/travellers', asyncHandler(bookingController.addTravellers));

// Admin — invoice generation and the booking list are staff-only here (a
// deliberate tightening vs. the legacy controller, which gated the whole
// class behind a lighter "front-auth" token rather than admin auth).
router.get('/', authenticate, authorize('read:booking'), asyncHandler(bookingController.findAll));
router.get('/:id', authenticate, authorize('read:booking'), asyncHandler(bookingController.findById));
router.post('/:id/invoice', authenticate, authorize('create:booking'), asyncHandler(bookingController.createInvoice));
router.post('/bulk/delete', authenticate, authorize('delete:booking'), asyncHandler(bookingController.bulkRemove));
router.delete('/:id', authenticate, authorize('delete:booking'), asyncHandler(bookingController.remove));

export default router;
