import { Prisma } from '@prisma/client';
import { CostCategoryRepository } from './cost-category.repository';
import { CreateCostCategoryDtoType, UpdateCostCategoryDtoType, GetCostCategoriesDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { revalidateFrontendTags } from '../../lib/revalidate-frontend';

// Package pages cache under these tags — a renamed/re-iconed category changes every package using it.
const REVALIDATE_TAGS = ['packages', 'trips'];

export class CostCategoryService {
  constructor(private repository: CostCategoryRepository) {}

  async create(dto: CreateCostCategoryDtoType) {
    return this.repository.create(dto);
  }

  async findAll(dto: GetCostCategoriesDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.CostCategoryWhereInput = {
      deletedAt: null,
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
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
    if (!category || category.deletedAt) throw new ApiError(404, 'Cost category not found');
    return category;
  }

  async update(id: string, dto: UpdateCostCategoryDtoType) {
    const existing = await this.findById(id);
    if (dto.type && dto.type !== existing.type) {
      throw new ApiError(400, 'A category\'s type cannot be changed after creation');
    }
    const category = await this.repository.update(id, dto);
    if (dto.name && dto.name !== existing.name) await this.repository.syncDetailKey(id, dto.name);
    void revalidateFrontendTags(REVALIDATE_TAGS);
    return category;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.repository.softDelete(id);
    void revalidateFrontendTags(REVALIDATE_TAGS);
  }
}
