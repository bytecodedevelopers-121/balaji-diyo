import { Request, Response, NextFunction } from 'express';
import type { B2BPartnerStatus, B2BUserRole } from '@prisma/client';
import { ApiError } from '../exceptions/api-error';
import { authenticate, type AuthUserPayload } from './jwt.guard';

const INACTIVE_PARTNER_MESSAGE: Record<B2BPartnerStatus, string> = {
  PENDING_KYC: 'Your agency account is pending KYC approval',
  REJECTED: 'Your agency application was rejected',
  SUSPENDED: 'Your agency account is suspended',
  ACTIVE: '',
};

/** Internal staff only — any account bound to a partner is refused. */
export const requireInternalStaff = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (req.user.b2bPartnerId) return next(new ApiError(403, 'Internal staff access only'));
  next();
};

/** Partner users only; the tenant id is then always `req.user.b2bPartnerId`. */
export const requirePartnerUser = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (!req.user.b2bPartnerId) return next(new ApiError(403, 'Partner account required'));
  next();
};

/** Operational actions need an ACTIVE partner (KYC approved, not suspended). */
export const requireActivePartner = (req: Request, _res: Response, next: NextFunction): void => {
  const status = req.user?.b2bPartnerStatus;
  if (status !== 'ACTIVE') {
    return next(new ApiError(403, (status && INACTIVE_PARTNER_MESSAGE[status]) || 'Partner account is not active'));
  }
  next();
};

export const requireB2BRole = (...roles: B2BUserRole[]) => (req: Request, _res: Response, next: NextFunction): void => {
  const role = req.user?.b2bRole;
  if (!role || !roles.includes(role)) {
    return next(new ApiError(403, `Requires agency role: ${roles.join(' or ')}`));
  }
  next();
};

/**
 * Standard chain for operational partner endpoints: authenticated partner user,
 * ACTIVE agency, and (optionally) one of the given agency roles. Spread into a
 * route: `router.get(path, ...partnerOperational('AGENCY_ADMIN'), handler)`.
 */
export const partnerOperational = (...roles: B2BUserRole[]) => [
  authenticate,
  requirePartnerUser,
  requireActivePartner,
  ...(roles.length > 0 ? [requireB2BRole(...roles)] : []),
];

/** Narrowing helper for services/controllers behind requirePartnerUser. */
export const partnerScope = (user: AuthUserPayload | undefined): { partnerId: string; userId: string; b2bRole: B2BUserRole | null } => {
  if (!user?.b2bPartnerId) throw new ApiError(403, 'Partner account required');
  return { partnerId: user.b2bPartnerId, userId: user.userId, b2bRole: user.b2bRole };
};
