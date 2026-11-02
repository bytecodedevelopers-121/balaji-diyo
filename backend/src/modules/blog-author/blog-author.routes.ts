import { Router } from 'express';
import { blogAuthorController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Public — author bylines render on the public blog.
router.get('/', asyncHandler(blogAuthorController.findAll));
router.get('/:id', asyncHandler(blogAuthorController.findById));

router.post('/', authenticate, authorize('create:blog'), asyncHandler(blogAuthorController.create));
router.patch('/:id', authenticate, authorize('update:blog'), asyncHandler(blogAuthorController.update));
router.delete('/:id', authenticate, authorize('delete:blog'), asyncHandler(blogAuthorController.remove));

export default router;
