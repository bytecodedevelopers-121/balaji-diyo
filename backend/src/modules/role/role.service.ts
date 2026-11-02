// src/modules/role/role.service.ts
import { RoleRepository } from './role.repository';
import { CreateRoleDtoType, UpdateRoleDtoType, GetRolesDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationMetaDto, PaginationQueryDto } from '../../common/dto/pagination.dto';

export class RoleService {
  constructor(private repository: RoleRepository) {}

  async create(dto: CreateRoleDtoType) {
    const { permissionIds, ...roleData } = dto;

    const data: any = {
      ...roleData,
      isSystem: false,
    };

    if (permissionIds?.length) {
      data.permissions = { connect: permissionIds.map((id: string) => ({ id })) };
    }

    return this.repository.create(data);
  }

  async findAll(dto: GetRolesDtoType) {
    const pagination = new PaginationQueryDto({
      page: dto.page,
      perPage: dto.perPage,
    });

    const where: any = {};

    if (dto.search) {
      where.name = { contains: dto.search, mode: 'insensitive' };
    }

    if (dto.isSystem !== undefined) {
      where.isSystem = dto.isSystem;
    }

    const [roles, total] = await Promise.all([
      this.repository.findMany(where, {
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.repository.count(where),
    ]);

    const meta = new PaginationMetaDto({
      page: pagination.page,
      perPage: pagination.perPage,
      total,
    });

    return PaginationDto.create({
      items: roles,
      page: pagination.page,
      perPage: pagination.perPage,
      total,
    });
  }

  async findById(id: string) {
    const role = await this.repository.findById(id);
    if (!role) throw new ApiError(404, 'Role not found');

    return role;
  }

  async update(id: string, dto: UpdateRoleDtoType) {
    await this.findById(id);

    const { permissionIds, ...roleData } = dto;
    const data: any = { ...roleData };

    if (permissionIds) {
      data.permissions = { set: permissionIds.map((id: string) => ({ id })) };
    }

    return this.repository.update(id, data);
  }

  async findAllPermissions() {
    return this.repository.findAllPermissions();
  }
}
