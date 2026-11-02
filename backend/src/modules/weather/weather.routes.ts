import { Router } from 'express';
import { weatherController } from '../../config/container';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

router.get('/packages/:packageId', asyncHandler(weatherController.getPackageForecast));

export default router;
