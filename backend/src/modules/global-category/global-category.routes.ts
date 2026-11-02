import { Router } from 'express';
import { globalCategoryController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.post('/', authorize('create:settings'), asyncHandler(globalCategoryController.create));
router.get('/', authorize('read:settings'), asyncHandler(globalCategoryController.findAll));
router.get('/:id', authorize('read:settings'), asyncHandler(globalCategoryController.findById));
router.patch('/:id', authorize('update:settings'), asyncHandler(globalCategoryController.update));
router.delete('/:id', authorize('delete:settings'), asyncHandler(globalCategoryController.remove));

export default router;
