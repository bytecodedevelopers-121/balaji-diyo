import { Router } from 'express';
import { pageSectionController as c } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Public — the website reads one page's sections in a single request.
router.get('/public/:pageKey', asyncHandler(c.getPublic));

router.use(authenticate);
router.get('/', authorize('read:settings'), asyncHandler(c.listPages));
router.get('/:pageKey', authorize('read:settings'), asyncHandler(c.getAdmin));
router.put('/:pageKey/:sectionKey', authorize('update:settings'), asyncHandler(c.save));

export default router;
