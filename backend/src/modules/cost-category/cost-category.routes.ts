import { Router } from 'express';
import { costCategoryController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(costCategoryController.findAll));
router.get('/:id', asyncHandler(costCategoryController.findById));

router.post('/', authenticate, authorize('create:travel'), asyncHandler(costCategoryController.create));
router.patch('/:id', authenticate, authorize('update:travel'), asyncHandler(costCategoryController.update));
router.delete('/:id', authenticate, authorize('delete:travel'), asyncHandler(costCategoryController.remove));

export default router;
