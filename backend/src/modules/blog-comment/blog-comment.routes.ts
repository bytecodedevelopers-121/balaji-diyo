import { Router } from 'express';
import { blogCommentController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Public — unauthenticated submission (rate-limited globally, see app.ts) +
// public approved-comments thread.
router.post('/', asyncHandler(blogCommentController.create));
router.get('/blog/:blogId', asyncHandler(blogCommentController.findForBlog));

// Admin moderation.
router.get('/', authenticate, authorize('read:comment'), asyncHandler(blogCommentController.findAllAdmin));
router.patch('/:id/approve', authenticate, authorize('update:comment'), asyncHandler(blogCommentController.approve));
router.patch('/:id/reject', authenticate, authorize('update:comment'), asyncHandler(blogCommentController.reject));
router.delete('/:id', authenticate, authorize('delete:comment'), asyncHandler(blogCommentController.remove));

export default router;
