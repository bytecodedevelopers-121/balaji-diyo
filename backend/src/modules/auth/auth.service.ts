import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { AccessTokenResponse, AuthResponse, TokenPayload } from './types';
import { ApiError } from '../../common/exceptions/api-error';
import { RegisterDtoType } from './dto/register.dto';
import { LoginDtoType } from './dto/login.dto';
import { verifyRefreshToken } from '../../common/utils/jwt';

export class AuthService {
  constructor(private repository: AuthRepository) {}

  async register(dto: RegisterDtoType): Promise<AuthResponse> {
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) throw new ApiError(409, 'User already exists');

    const user = await this.repository.createUser(dto);

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDtoType): Promise<AuthResponse> {
    const user = await this.repository.findByEmail(dto.email);
    if (!user) throw new ApiError(401, 'Invalid credentials');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new ApiError(401, 'Invalid credentials');

    if (!user.isActive) throw new ApiError(403, 'Account is inactive');

    await this.repository.updateLastLogin(user.id);

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string): Promise<AccessTokenResponse> {
    const payload = verifyRefreshToken(refreshToken);

    // The JWT is already verified above. A DB connection failure here is a
    // temporary infrastructure outage, not an auth failure — return 503 so the
    // frontend can retain the cached session instead of logging the user out.
    const user = await this.repository.findById(payload.userId).catch(() => {
      throw new ApiError(503, 'Service temporarily unavailable');
    });
    if (!user) throw new ApiError(401, 'User not found');
    if (!user.isActive) throw new ApiError(403, 'Account is inactive');

    const freshPayload = this.buildPayload(user);

    return {
      accessToken: this.signAccessToken(freshPayload),
      user: freshPayload,
    };
  }

  private buildAuthResponse(user: any): AuthResponse {
    const payload = this.buildPayload(user);

    return {
      accessToken: this.signAccessToken(payload),
      refreshToken: this.signRefreshToken(payload),
      user: payload,
    };
  }

  private buildPayload(user: any): TokenPayload {
    return {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      isSuperAdmin: user.isSuperAdmin,
    };
  }

  private signAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '15m',
    });
  }

  private signRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: '7d',
    });
  }
}
