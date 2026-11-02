// ══════════════════════════════════════════════════════════════════════════════
// OLD files routes (Supabase signed URLs) — kept for future reference
// ══════════════════════════════════════════════════════════════════════════════
/*
import { Router } from 'express';
import { filesController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.post('/signed-url',  authenticate, asyncHandler(filesController.getSignedUrl));
router.post('/signed-urls', authenticate, asyncHandler(filesController.getSignedUrls));
router.delete('/delete',    authenticate, asyncHandler(filesController.deleteFile));

export default router;
*/

// ── New files routes (local disk storage) ─────────────────────────────────────

import { Router } from 'express';
import { filesController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import asyncHandler from '../../common/utils/asyncHandler';
import { uploadPublic, uploadPrivate, uploadPassport } from '../../config/multer';

const router = Router();

// Public upload: image → memory → sharp → disk (no auth required — path is safe)
router.post('/upload/public',  uploadPublic.single('file'),  asyncHandler(filesController.uploadPublic));

// Public upload, private storage: the booking checkout form has no session
// to authenticate, but a passport scan is sensitive PII — see
// FilesController.uploadBookingPassport's own comment.
router.post('/upload/passport', uploadPassport.single('file'), asyncHandler(filesController.uploadBookingPassport));

// Same shape as the passport route above, for the per-traveller personal
// photo field — reuses the `uploadPassport` multer instance since it's
// already just a generic image-memory-storage config, not passport-specific.
router.post('/upload/photo', uploadPassport.single('file'), asyncHandler(filesController.uploadBookingPhoto));

// Private upload: document → disk (auth required)
router.post('/upload/private', authenticate, uploadPrivate.single('file'), asyncHandler(filesController.uploadPrivate));

// Serve private file (auth required — path traversal guarded in controller)
router.get('/private/*path', authenticate, asyncHandler(filesController.servePrivate));

// Delete file (auth required — path traversal guarded in service)
router.delete('/delete', authenticate, asyncHandler(filesController.deleteFile));

export default router;  
