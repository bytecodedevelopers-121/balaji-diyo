// src/modules/user/user.service.ts
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { UserRepository } from './user.repository';
import { RoleRepository } from '../role/role.repository';
import {
  CreateUserDtoType,
  UpdateUserDtoType,
  UpdateProfileDtoType,
  ChangePasswordDtoType,
  ResetPasswordDtoType,
} from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { AuthUserPayload } from '../../common/guards/jwt.guard';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { UserListQuery, UserResponse } from './types';

export class UserService {
  constructor(
    private repository: UserRepository,
    private roleRepository: RoleRepository,
  ) {}

  async create(dto: CreateUserDtoType) {
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) throw new ApiError(409, 'A user with this email already exists');

    if (!dto.roleId) throw new ApiError(400, 'roleId is required');

    const role = await this.roleRepository.findById(dto.roleId);
    if (!role) throw new ApiError(404, 'Role not found');

    return this.repository.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      roleId: dto.roleId,
    });
  }

  async findAll(query: UserListQuery): Promise<PaginationDto<UserResponse>> {
    const where: Prisma.UserWhereInput = {
      ...(query.roleId ? { roleId: query.roleId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };
    const pagination = new PaginationQueryDto({ page: query.page, perPage: query.limit });

    const [items, total] = await Promise.all([
      this.repository.findAll(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({
      items,
      page: pagination.page,
      perPage: pagination.perPage,
      total,
    });
  }

  async findById(id: string) {
    const target = await this.repository.findById(id);
    if (!target) throw new ApiError(404, 'User not found');

    return target;
  }

  async update(id: string, dto: UpdateUserDtoType) {
    const target = await this.repository.findById(id);
    if (!target) throw new ApiError(404, 'User not found');

    return this.repository.update(id, dto);
  }

  async activate(id: string) {
    const target = await this.repository.findById(id);
    if (!target) throw new ApiError(404, 'User not found');

    return this.repository.update(id, { isActive: true });
  }

  async deactivate(id: string) {
    const target = await this.repository.findById(id);
    if (!target) throw new ApiError(404, 'User not found');

    return this.repository.update(id, { isActive: false });
  }

  async remove(id: string) {
    const target = await this.repository.findById(id);
    if (!target) throw new ApiError(404, 'User not found');

    await this.repository.delete(id);
  }

  async restore(id: string) {
    const target = await this.repository.findByIdWithDeleted(id);
    if (!target) throw new ApiError(404, 'User not found');
    if (!target.deletedAt) throw new ApiError(400, 'User is not deleted');

    return this.repository.restore(id);
  }

  async getDeleted(user: AuthUserPayload) {
    if (!user.isSuperAdmin) throw new ApiError(403, 'Only super admins can view deleted users');
    return this.repository.findDeleted();
  }

  async resetPassword(id: string, dto: ResetPasswordDtoType) {
    const target = await this.repository.findById(id);
    if (!target) throw new ApiError(404, 'User not found');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    return this.repository.updatePassword(id, hashedPassword);
  }

  async updateProfile(userId: string, dto: UpdateProfileDtoType) {
    return this.repository.update(userId, dto);
  }

  async changePassword(userId: string, dto: ChangePasswordDtoType) {
    const target = await this.repository.findByIdWithPassword(userId);
    if (!target) throw new ApiError(404, 'User not found');

    const isValid = await bcrypt.compare(dto.currentPassword, target.password);
    if (!isValid) throw new ApiError(401, 'Current password is incorrect');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.repository.updatePassword(userId, hashedPassword);
  }
}
