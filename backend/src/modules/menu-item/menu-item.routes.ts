import { Router } from 'express';
import { menuItemController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { authorize } from '../../common/guards/permission.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Public — the frontend site renders nav from this (header/footer menus).
router.get('/', asyncHandler(menuItemController.findAll));
// By type key (e.g. "main_menu"/"footer_menu") — what the public site
// actually calls, since it has no way to know a MenuType's internal id.
// isActive-filtered, unlike /tree/:typeId below (see findTreeByKey).
router.get('/tree/by-key/:key', asyncHandler(menuItemController.findTreeByKey));
router.get('/tree/:typeId', asyncHandler(menuItemController.findTree));
router.get('/:id', asyncHandler(menuItemController.findById));

router.post('/', authenticate, authorize('create:menu'), asyncHandler(menuItemController.create));
// Must stay above PATCH /:id or Express would match "reorder" as an id.
router.patch('/reorder', authenticate, authorize('update:menu'), asyncHandler(menuItemController.reorder));
router.patch('/:id', authenticate, authorize('update:menu'), asyncHandler(menuItemController.update));
router.delete('/:id', authenticate, authorize('delete:menu'), asyncHandler(menuItemController.remove));
router.post('/:id/restore', authenticate, authorize('update:menu'), asyncHandler(menuItemController.restore));

export default router;
