import { Router } from 'express';
import { packageMapController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Reads are public — trip maps render on the public package page, same as
// Departures, plus the /trekking-routes-map-of-nepal listing + detail
// pages. /slug/:slug before /:id, same ordering as team-member.routes.ts.
router.get('/', asyncHandler(packageMapController.findAll));
router.get('/slug/:slug', asyncHandler(packageMapController.findPublicBySlug));
router.get('/:id', asyncHandler(packageMapController.findById));

router.post('/', authenticate, authorize('create:travel'), asyncHandler(packageMapController.create));
router.patch('/:id', authenticate, authorize('update:travel'), asyncHandler(packageMapController.update));
router.delete('/:id', authenticate, authorize('delete:travel'), asyncHandler(packageMapController.remove));
router.post('/:id/restore', authenticate, authorize('update:travel'), asyncHandler(packageMapController.restore));
router.delete('/:id/permanent', authenticate, authorize('delete:travel'), asyncHandler(packageMapController.hardDelete));

export default router;
