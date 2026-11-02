import { Router } from 'express';
import { globalSettingController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Public — frontend consumption (site info, socials, logo, etc). The bulk
// route comes first so the public Next.js site's Header/Footer can pull
// everything they need (phone, socials, logo, ...) in one request instead
// of one round trip per key; the single-key route stays for a page that
// only needs one value.
router.get('/public', asyncHandler(globalSettingController.findAllPublic));
router.get('/public/:key', asyncHandler(globalSettingController.findPublicByKey));

router.use(authenticate);

router.post('/', authorize('create:settings'), asyncHandler(globalSettingController.create));
router.get('/', authorize('read:settings'), asyncHandler(globalSettingController.findAll));
router.get('/:id', authorize('read:settings'), asyncHandler(globalSettingController.findById));
router.patch('/:id', authorize('update:settings'), asyncHandler(globalSettingController.update));
router.delete('/:id', authorize('delete:settings'), asyncHandler(globalSettingController.remove));

export default router;
