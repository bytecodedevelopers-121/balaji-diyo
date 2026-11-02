import jwt from 'jsonwebtoken';
import { TokenPayload } from '../../modules/auth/types';
import { ApiError } from '../exceptions/api-error';

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new ApiError(500, 'JWT_SECRET is not configured');
    }

    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid token');
    }
    throw new ApiError(401, 'Authentication failed');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
  } catch (error: any) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
};