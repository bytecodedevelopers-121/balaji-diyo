import { Router } from 'express';
import { b2bBookingController, b2bBookingAdminController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import { partnerOperational, requireInternalStaff } from '../../common/guards/b2b.guard';
import asyncHandler from '../../common/utils/asyncHandler';

// Partner routes — mounted at /api/b2b (per-route guards: the prefix also hosts the public registration route).
export const partnerBookingRoutes = Router();
partnerBookingRoutes.post('/bookings/instant', ...partnerOperational('AGENCY_ADMIN', 'BOOKING_AGENT'), asyncHandler(b2bBookingController.instant));
partnerBookingRoutes.post('/bookings/on-request', ...partnerOperational('AGENCY_ADMIN', 'BOOKING_AGENT'), asyncHandler(b2bBookingController.onRequest));
partnerBookingRoutes.get('/bookings', ...partnerOperational(), asyncHandler(b2bBookingController.list));
partnerBookingRoutes.get('/bookings/:id', ...partnerOperational(), asyncHandler(b2bBookingController.get));
partnerBookingRoutes.post('/bookings/:id/cancel', ...partnerOperational('AGENCY_ADMIN', 'BOOKING_AGENT'), asyncHandler(b2bBookingController.cancel));
partnerBookingRoutes.post('/bookings/:id/amend', ...partnerOperational('AGENCY_ADMIN', 'BOOKING_AGENT'), asyncHandler(b2bBookingController.amend));

// Internal routes — mounted at /api/admin/b2b
export const adminBookingRoutes = Router();
const staff = [authenticate, requireInternalStaff];
adminBookingRoutes.get('/bookings', ...staff, authorize('read:b2b_booking'), asyncHandler(b2bBookingAdminController.list));
adminBookingRoutes.get('/bookings/:id', ...staff, authorize('read:b2b_booking'), asyncHandler(b2bBookingAdminController.get));
adminBookingRoutes.post('/bookings/:id/approve', ...staff, authorize('update:b2b_booking'), asyncHandler(b2bBookingAdminController.approve));
adminBookingRoutes.post('/bookings/:id/reject', ...staff, authorize('update:b2b_booking'), asyncHandler(b2bBookingAdminController.reject));
adminBookingRoutes.post('/bookings/:id/cancel', ...staff, authorize('update:b2b_booking'), asyncHandler(b2bBookingAdminController.cancel));
adminBookingRoutes.post('/bookings/:id/amendment/resolve', ...staff, authorize('update:b2b_booking'), asyncHandler(b2bBookingAdminController.resolveAmendment));
