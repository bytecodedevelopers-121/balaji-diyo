import { Prisma } from '@prisma/client';
import { MenuTypeRepository } from './menu-type.repository';
import { CreateMenuTypeDtoType, UpdateMenuTypeDtoType, GetMenuTypesDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';

export class MenuTypeService {
  constructor(private repository: MenuTypeRepository) {}

  async create(dto: CreateMenuTypeDtoType) {
    const existing = await this.repository.findByKey(dto.key);
    if (existing) throw new ApiError(409, 'A menu type with this key already exists');

    return this.repository.create(dto);
  }

  async findAll(dto: GetMenuTypesDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.MenuTypeWhereInput = {
      deletedAt: null,
      ...(dto.search ? { name: { contains: dto.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const type = await this.repository.findById(id);
    if (!type || type.deletedAt) throw new ApiError(404, 'Menu type not found');
    return type;
  }

  async update(id: string, dto: UpdateMenuTypeDtoType) {
    await this.findById(id);

    if (dto.key) {
      const existing = await this.repository.findByKey(dto.key);
      if (existing && existing.id !== id) throw new ApiError(409, 'A menu type with this key already exists');
    }

    return this.repository.update(id, dto);
  }

  async remove(id: string) {
    await this.findById(id);

    const inUse = await this.repository.countItems(id);
    if (inUse > 0) throw new ApiError(409, `Cannot delete: ${inUse} menu items still use this type`);

    await this.repository.softDelete(id);
  }

  async restore(id: string) {
    const type = await this.repository.findById(id);
    if (!type) throw new ApiError(404, 'Menu type not found');

    await this.repository.restore(id);
  }
}
