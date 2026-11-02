import { Prisma } from '@prisma/client';
import { GlobalCategoryRepository } from './global-category.repository';
import { CreateGlobalCategoryDtoType, UpdateGlobalCategoryDtoType, GetGlobalCategoriesDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';

export class GlobalCategoryService {
  constructor(private repository: GlobalCategoryRepository) {}

  async create(dto: CreateGlobalCategoryDtoType) {
    const existing = await this.repository.findByKey(dto.key);
    if (existing) throw new ApiError(409, 'A global category with this key already exists');

    return this.repository.create(dto);
  }

  async findAll(dto: GetGlobalCategoriesDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.GlobalCategoryWhereInput = {
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
    const category = await this.repository.findById(id);
    if (!category || category.deletedAt) throw new ApiError(404, 'Global category not found');
    return category;
  }

  async update(id: string, dto: UpdateGlobalCategoryDtoType) {
    await this.findById(id);

    if (dto.key) {
      const existing = await this.repository.findByKey(dto.key);
      if (existing && existing.id !== id) throw new ApiError(409, 'A global category with this key already exists');
    }

    return this.repository.update(id, dto);
  }

  async remove(id: string) {
    await this.findById(id);

    const inUse = await this.repository.countSettings(id);
    if (inUse > 0) throw new ApiError(409, `Cannot delete: ${inUse} settings still use this category`);

    await this.repository.softDelete(id);
  }
}
