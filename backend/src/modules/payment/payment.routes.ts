import express, { Router } from 'express';
import { paymentController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Public — called directly by the customer's browser (checkout) and by
// PACO's own servers (callback), neither of which carries an admin JWT. Must
// stay above the `authenticate` gate below, which covers every other route
// in this file (admin-only record-keeping — see payment.service.ts).
router.post('/paco/checkout', asyncHandler(paymentController.initiatePaco));
// text() catches bodies the json/urlencoded parsers skip (unknown content-type).
router.post('/paco/callback', express.text({ type: () => true }), asyncHandler(paymentController.pacoCallback));

router.use(authenticate);

router.post('/', authorize('create:payment'), asyncHandler(paymentController.create));
router.get('/', authorize('read:payment'), asyncHandler(paymentController.findAll));
router.get('/:id', authorize('read:payment'), asyncHandler(paymentController.findById));
router.patch('/:id/status', authorize('update:payment'), asyncHandler(paymentController.updateStatus));
router.delete('/:id', authorize('delete:payment'), asyncHandler(paymentController.remove));
router.post('/:id/restore', authorize('update:payment'), asyncHandler(paymentController.restore));
router.delete('/:id/permanent', authorize('delete:payment'), asyncHandler(paymentController.hardDelete));

export default router;
