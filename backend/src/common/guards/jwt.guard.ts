import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../exceptions/api-error';
import prisma from '../../config/prisma';
import { verifyAccessToken } from '../utils/jwt';

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
}

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
      },
    });

    if (!userWithPermissions || !userWithPermissions.isActive) {
      throw new ApiError(401, 'User account is inactive or not found');
    }

    // Build clean user object
    const userPermissions = userWithPermissions.role.permissions.map(
      (p: any) => `${p.action}:${p.subject}`
    );

    req.user = {
      userId: userWithPermissions.id,
      email: userWithPermissions.email,
      role: userWithPermissions.role.name,
      isSuperAdmin: userWithPermissions.isSuperAdmin,
      permissions: userPermissions,
    };

    next();
  } catch (err) {
    next(err);
  }
};