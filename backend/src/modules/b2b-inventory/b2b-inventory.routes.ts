import { Router } from 'express';
import { b2bInventoryController } from '../../config/container';
import { partnerOperational } from '../../common/guards/b2b.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Any agency role can look; only admins and booking agents can take or give back seats.
router.get('/inventory/holds', ...partnerOperational(), asyncHandler(b2bInventoryController.listHolds));
router.get('/inventory/holds/:id', ...partnerOperational(), asyncHandler(b2bInventoryController.getHold));
router.post('/inventory/holds', ...partnerOperational('AGENCY_ADMIN', 'BOOKING_AGENT'), asyncHandler(b2bInventoryController.createHold));
router.post('/inventory/holds/:id/release', ...partnerOperational('AGENCY_ADMIN', 'BOOKING_AGENT'), asyncHandler(b2bInventoryController.releaseHold));

export default router;
