import { Router } from 'express';
import { attachmentController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Attachments are a media-library concern (linking a Media row to some owner
// entity + role) — reuses the `media` permission subject rather than minting
// a new one.
router.get('/', authenticate, authorize('read:media'), asyncHandler(attachmentController.findByOwner));
router.post('/', authenticate, authorize('create:media'), asyncHandler(attachmentController.attach));
router.patch('/reorder', authenticate, authorize('update:media'), asyncHandler(attachmentController.reorder));
router.delete('/:id', authenticate, authorize('delete:media'), asyncHandler(attachmentController.detach));

export default router;
