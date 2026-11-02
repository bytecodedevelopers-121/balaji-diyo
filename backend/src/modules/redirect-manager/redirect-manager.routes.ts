import { Router } from 'express';
import { redirectManagerController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Public — per-request lookup, e.g. from Next.js middleware, before falling
// through to a 404.
router.get('/resolve', asyncHandler(redirectManagerController.resolve));

router.use(authenticate);

router.post('/', authorize('create:redirect'), asyncHandler(redirectManagerController.create));
router.post('/bulk', authorize('create:redirect'), asyncHandler(redirectManagerController.createBulk));
router.get('/', authorize('read:redirect'), asyncHandler(redirectManagerController.findAll));
router.get('/:id', authorize('read:redirect'), asyncHandler(redirectManagerController.findById));
router.patch('/:id', authorize('update:redirect'), asyncHandler(redirectManagerController.update));
router.delete('/:id', authorize('delete:redirect'), asyncHandler(redirectManagerController.remove));
router.post('/bulk/delete', authorize('delete:redirect'), asyncHandler(redirectManagerController.bulkRemove));

export default router;
