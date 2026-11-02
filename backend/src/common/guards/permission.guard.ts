import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../exceptions/api-error';

const matchPermission = (required: string, userPerms: string[]): boolean => {
  if (userPerms.includes('*'))        return true;  // super admin
  if (userPerms.includes(required))   return true;  // exact match

  const [module] = required.split(':');
  if (userPerms.includes(`${module}:*`)) return true; // wildcard e.g. leave:*

  return false;
};

// Used inline in routes: authorize('leave:read')
export const authorize = (...requiredPermissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

    const userPerms: string[] = [
      ...((req.user as any).permissions     || []),
      ...((req.user as any).rolePermissions || []),
    ];

    const allPerms = [...new Set(userPerms)];

    const hasAccess = requiredPermissions.some((perm) =>
      matchPermission(perm, allPerms)
    );

    if (!hasAccess) {
      return next(
        new ApiError(403, `Access denied. Required: ${requiredPermissions.join(' or ')}`)
      );
    }

    next();
  };
};

// Keep PermissionsGuard for backward compatibility if used elsewhere
export const PermissionsGuard = (req: Request, _res: Response, next: NextFunction): void => {
  next();
};