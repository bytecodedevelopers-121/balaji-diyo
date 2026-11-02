import { Request, Response, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';
import { ApiError } from '../../common/exceptions/api-error';
import { appConfig } from '../../config/app-config';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: appConfig.isProduction,
  sameSite: appConfig.isProduction ? 'none' : 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response) => {
    const dto = RegisterDto.parse(req.body);
    const result = await this.authService.register(dto);

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshCookieOptions);

    SuccessResponseDto.created(res, {
      message: 'Account created successfully',
      data: { accessToken: result.accessToken, user: result.user },
      req,
    });
  };

  login = async (req: Request, res: Response) => {
    const dto = LoginDto.parse(req.body);
    const result = await this.authService.login(dto);

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshCookieOptions);

    SuccessResponseDto.send(res, {
      message: 'Login successful',
      data: { accessToken: result.accessToken, user: result.user },
      req,
    });
  };

  refresh = async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!token) throw new ApiError(401, 'Refresh token missing');

    const result = await this.authService.refresh(token);

    SuccessResponseDto.send(res, {
      message: 'Token refreshed successfully',
      data: result,
      req,
    });
  };

  logout = async (req: Request, res: Response) => {
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: refreshCookieOptions.path });

    SuccessResponseDto.send(res, {
      message: 'Logged out successfully',
      req,
    });
  };

  me = async (req: Request, res: Response) => {
    SuccessResponseDto.send(res, {
      message: 'User profile fetched',
      data: req.user,
      req,
    });
  };
}
