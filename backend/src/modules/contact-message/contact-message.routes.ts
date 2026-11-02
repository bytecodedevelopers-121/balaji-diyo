import { Router } from 'express';
import { contactMessageController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import { verifyCaptcha } from '../../common/guards/captcha.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Public — the site's contact/inquiry form (rate-limited globally, see
// app.ts; captcha-gated, see captcha.guard.ts).
router.post('/', verifyCaptcha, asyncHandler(contactMessageController.create));

router.get('/', authenticate, authorize('read:contact'), asyncHandler(contactMessageController.findAll));
router.get('/:id', authenticate, authorize('read:contact'), asyncHandler(contactMessageController.findById));
router.patch('/:id/read', authenticate, authorize('update:contact'), asyncHandler(contactMessageController.markRead));
router.patch('/:id/unread', authenticate, authorize('update:contact'), asyncHandler(contactMessageController.markUnread));
router.post('/bulk/delete', authenticate, authorize('delete:contact'), asyncHandler(contactMessageController.bulkRemove));
router.delete('/:id', authenticate, authorize('delete:contact'), asyncHandler(contactMessageController.remove));

export default router;
