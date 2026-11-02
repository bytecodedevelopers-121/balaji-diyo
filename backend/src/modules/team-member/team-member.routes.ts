import { Router } from 'express';
import { teamMemberController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(teamMemberController.findAll));
router.get('/slug/:slug', asyncHandler(teamMemberController.findPublicBySlug));
router.get('/:id', asyncHandler(teamMemberController.findById));

router.post('/', authenticate, authorize('create:team'), asyncHandler(teamMemberController.create));
router.patch('/:id', authenticate, authorize('update:team'), asyncHandler(teamMemberController.update));
router.delete('/:id', authenticate, authorize('delete:team'), asyncHandler(teamMemberController.remove));

export default router;
