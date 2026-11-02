import { Router } from 'express';
import { mediaController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';
import { uploadMediaLibrary } from '../../config/multer';

const router = Router();

// Media library is an admin-only concern — the public frontend consumes
// already-resolved image paths embedded in post/page responses, not this API.
router.post(
  '/upload',
  authenticate,
  authorize('create:media'),
  uploadMediaLibrary.single('file'),
  asyncHandler(mediaController.upload),
);
router.get('/', authenticate, authorize('read:media'), asyncHandler(mediaController.findAll));
router.get('/:id', authenticate, authorize('read:media'), asyncHandler(mediaController.findById));
router.patch('/:id', authenticate, authorize('update:media'), asyncHandler(mediaController.update));
router.delete('/:id', authenticate, authorize('delete:media'), asyncHandler(mediaController.remove));

export default router;
