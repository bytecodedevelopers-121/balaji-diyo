import { Router } from 'express';
import { b2bDeveloperController, b2bCatalogController, b2bPricingController, b2bBookingController, apiKeyAuth } from '../../config/container';
import { partnerOperational, requireActivePartner } from '../../common/guards/b2b.guard';
import { apiKeyFailureLimiter } from '../../config/rate-limit';
import asyncHandler from '../../common/utils/asyncHandler';

// Dashboard routes — mounted at /api/b2b. Agency admins only; guards are per-route (prefix also hosts public registration).
export const developerRoutes = Router();
const admin = partnerOperational('AGENCY_ADMIN');
developerRoutes.get('/developer/api-keys', ...admin, asyncHandler(b2bDeveloperController.listKeys));
developerRoutes.post('/developer/api-keys', ...admin, asyncHandler(b2bDeveloperController.createKey));
developerRoutes.post('/developer/api-keys/:id/rotate', ...admin, asyncHandler(b2bDeveloperController.rotateKey));
developerRoutes.delete('/developer/api-keys/:id', ...admin, asyncHandler(b2bDeveloperController.revokeKey));
developerRoutes.get('/developer/webhooks', ...admin, asyncHandler(b2bDeveloperController.listWebhooks));
developerRoutes.post('/developer/webhooks', ...admin, asyncHandler(b2bDeveloperController.createWebhook));
developerRoutes.patch('/developer/webhooks/:id', ...admin, asyncHandler(b2bDeveloperController.updateWebhook));
developerRoutes.delete('/developer/webhooks/:id', ...admin, asyncHandler(b2bDeveloperController.deleteWebhook));
developerRoutes.post('/developer/webhooks/:id/rotate-secret', ...admin, asyncHandler(b2bDeveloperController.rotateSecret));
developerRoutes.post('/developer/webhooks/:id/test', ...admin, asyncHandler(b2bDeveloperController.sendTest));
developerRoutes.get('/developer/webhooks/:id/deliveries', ...admin, asyncHandler(b2bDeveloperController.deliveries));

// Partner API v1 — mounted at /api/v1/b2b. API-key auth only (no dashboard JWT), read/quote surface, tenant = the key's partner.
export const apiV1Routes = Router();
apiV1Routes.use(apiKeyFailureLimiter, apiKeyAuth, requireActivePartner);
apiV1Routes.get('/packages', asyncHandler(b2bCatalogController.list));
apiV1Routes.get('/packages/:id', asyncHandler(b2bCatalogController.detail));
apiV1Routes.post('/pricing/quote', asyncHandler(b2bPricingController.quote));
apiV1Routes.get('/bookings', asyncHandler(b2bBookingController.list));
apiV1Routes.get('/bookings/:id', asyncHandler(b2bBookingController.get));
