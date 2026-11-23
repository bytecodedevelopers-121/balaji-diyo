import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../exceptions/api-error';
import prisma from '../../config/prisma';
import { verifyAccessToken } from '../utils/jwt';
import type { B2BPartnerStatus, B2BUserRole } from '@prisma/client';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

// Update AuthUserPayload
export interface AuthUserPayload {
  userId: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
  permissions: string[];
  // B2B tenancy — always read fresh from the DB below, never from the JWT.
  // null on all three = internal staff / non-partner account.
  b2bPartnerId: string | null;
  b2bRole: B2BUserRole | null;
  b2bPartnerStatus: B2BPartnerStatus | null;
}

// Partner (agency) accounts may only reach their own B2B API plus the
// identity endpoints every account needs. Every other router mounted under
// /api is internal-admin surface, many of them guarded by `authenticate`
// alone, so partner users are fail-closed out of them here, centrally,
// instead of relying on each route remembering to opt out.
const PARTNER_ALLOWED_PATHS = /^\/api\/(b2b|auth)(\/|$)|^\/api\/users\/me\//;

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.userAccessToken;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      throw new ApiError(401, 'Authorization token missing');
    }

    // Verify JWT
    const payload = verifyAccessToken(token);

    if (!payload.userId) {
      throw new ApiError(401, 'Invalid token');
    }

    // Optional: Fetch fresh permissions from DB (recommended for security)
    const userWithPermissions = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        b2bPartner: { select: { status: true, deletedAt: true } },
      },
    });

    if (!userWithPermissions || !userWithPermissions.isActive || userWithPermissions.deletedAt) {
      throw new ApiError(401, 'User account is inactive or not found');
    }

    if (userWithPermissions.b2bPartnerId) {
      if (!userWithPermissions.b2bPartner || userWithPermissions.b2bPartner.deletedAt) {
        throw new ApiError(401, 'Partner account is no longer available');
      }
      const path = req.originalUrl.split('?')[0] ?? '';
      if (!PARTNER_ALLOWED_PATHS.test(path)) {
        throw new ApiError(403, 'Partner accounts cannot access this resource');
      }
    }

    // Build clean user object
    const userPermissions = userWithPermissions.role.permissions.map(
      (p) => `${p.action}:${p.subject}`
    );

    req.user = {
      userId: userWithPermissions.id,
      email: userWithPermissions.email,
      role: userWithPermissions.role.name,
      isSuperAdmin: userWithPermissions.isSuperAdmin,
      permissions: userPermissions,
      b2bPartnerId: userWithPermissions.b2bPartnerId,
      b2bRole: userWithPermissions.b2bRole,
      b2bPartnerStatus: userWithPermissions.b2bPartner?.status ?? null,
    };

    next();
  } catch (err) {
    next(err);
  }
};