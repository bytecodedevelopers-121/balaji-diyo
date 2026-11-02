// src/modules/user/user.controller.ts
import { Request, Response } from 'express';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UpdateProfileDto, ChangePasswordDto, ResetPasswordDto } from './dto';
import { SuccessResponseDto } from '../../common/dto/success-response.dto';

export class UserController {
  constructor(private service: UserService) {}

  create = async (req: Request, res: Response) => {
    const dto = CreateUserDto.parse(req.body);
    const result = await this.service.create(dto);

    SuccessResponseDto.created(res, {
      message: 'User created successfully',
      data: result,
      req,
    });
  };

  findAll = async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const roleId = req.query.roleId as string | undefined;
    const status = req.query.status as string | undefined;
    const isActive = status === 'active' ? true : status === 'inactive' ? false : undefined;

    const result = await this.service.findAll({ page, limit, roleId, isActive });

    SuccessResponseDto.send(res, {
      message: 'Users retrieved successfully',
      data: result,
      req,
    });
  };

  findById = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.params.id as string);

    SuccessResponseDto.send(res, {
      message: 'User retrieved successfully',
      data: result,
      req,
    });
  };

  update = async (req: Request, res: Response) => {
    const dto = UpdateUserDto.parse(req.body);
    const result = await this.service.update(req.params.id as string, dto);

    SuccessResponseDto.send(res, {
      message: 'User updated successfully',
      data: result,
      req,
    });
  };

  activate = async (req: Request, res: Response) => {
    const result = await this.service.activate(req.params.id as string);

    SuccessResponseDto.send(res, {
      message: 'User activated successfully',
      data: result,
      req,
    });
  };

  deactivate = async (req: Request, res: Response) => {
    const result = await this.service.deactivate(req.params.id as string);

    SuccessResponseDto.send(res, {
      message: 'User deactivated successfully',
      data: result,
      req,
    });
  };

  remove = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);

    SuccessResponseDto.send(res, {
      message: 'User deleted successfully',
      req,
    });
  };

  restore = async (req: Request, res: Response) => {
    const result = await this.service.restore(req.params.id as string);

    SuccessResponseDto.send(res, {
      message: 'User restored successfully',
      data: result,
      req,
    });
  };

  getDeleted = async (req: Request, res: Response) => {
    const result = await this.service.getDeleted(req.user!);

    SuccessResponseDto.send(res, {
      message: 'Deleted users retrieved successfully',
      data: result,
      req,
    });
  };

  resetPassword = async (req: Request, res: Response) => {
    const dto = ResetPasswordDto.parse(req.body);
    const result = await this.service.resetPassword(req.params.id as string, dto);

    SuccessResponseDto.send(res, {
      message: 'Password reset successfully',
      data: result,
      req,
    });
  };

  getProfile = async (req: Request, res: Response) => {
    const result = await this.service.findById(req.user!.userId);

    SuccessResponseDto.send(res, {
      message: 'Profile fetched successfully',
      data: result,
      req,
    });
  };

  updateProfile = async (req: Request, res: Response) => {
    const dto = UpdateProfileDto.parse(req.body);
    const result = await this.service.updateProfile(req.user!.userId, dto);

    SuccessResponseDto.send(res, {
      message: 'Profile updated successfully',
      data: result,
      req,
    });
  };

  changePassword = async (req: Request, res: Response) => {
    const dto = ChangePasswordDto.parse(req.body);
    await this.service.changePassword(req.user!.userId, dto);

    SuccessResponseDto.send(res, {
      message: 'Password changed successfully',
      req,
    });
  };
}
