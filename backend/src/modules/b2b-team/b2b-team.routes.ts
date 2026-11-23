import { Router } from 'express';
import { b2bTeamController } from '../../config/container';
import { authenticate } from '../../common/guards/jwt.guard';
import { requirePartnerUser, requireActivePartner, requireB2BRole } from '../../common/guards/b2b.guard';
import asyncHandler from '../../common/utils/asyncHandler';

const router = Router();

// Every team route: partner user + ACTIVE agency + AGENCY_ADMIN. The tenant
// is taken from the session (req.user.b2bPartnerId), never from the request.
router.use(authenticate, requirePartnerUser, requireActivePartner, requireB2BRole('AGENCY_ADMIN'));

router.get('/', asyncHandler(b2bTeamController.list));
router.post('/invite', asyncHandler(b2bTeamController.invite));
router.patch('/:userId', asyncHandler(b2bTeamController.update));

export default router;
