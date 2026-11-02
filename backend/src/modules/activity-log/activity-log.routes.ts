import { Router } from 'express';
import { activityLogController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Read-only, admin-only, on purpose — no create/delete route. Log entries
// are written internally via ActivityLogRepository.log() (see repository),
// never through the API, so nothing external can forge or erase them.
router.use(authenticate);

router.get('/', authorize('read:activity-log'), asyncHandler(activityLogController.findAll));
router.get('/:id', authorize('read:activity-log'), asyncHandler(activityLogController.findById));

export default router;
