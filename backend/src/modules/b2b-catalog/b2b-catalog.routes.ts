import { Router } from 'express';
import { b2bCatalogController } from '../../config/container';
import { partnerOperational } from '../../common/guards/b2b.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/packages', ...partnerOperational(), asyncHandler(b2bCatalogController.list));
router.get('/packages/:id', ...partnerOperational(), asyncHandler(b2bCatalogController.detail));

export default router;
