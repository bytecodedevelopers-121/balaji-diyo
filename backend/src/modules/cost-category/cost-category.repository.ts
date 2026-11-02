import { Prisma, PrismaClient } from '@prisma/client';
import type { CreateCostCategoryDtoType, UpdateCostCategoryDtoType } from './dto';

export class CostCategoryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateCostCategoryDtoType) {
    return this.prisma.costCategory.create({
      data: {
        name: data.name,
        type: data.type,
        icon: data.icon ?? null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateCostCategoryDtoType) {
    return this.prisma.costCategory.update({ where: { id }, data });
  }

  async findById(id: string) {
    return this.prisma.costCategory.findUnique({ where: { id } });
  }

  async findMany(where: Prisma.CostCategoryWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.costCategory.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      ...options,
    });
  }

  async count(where: Prisma.CostCategoryWhereInput) {
    return this.prisma.costCategory.count({ where });
  }

  async softDelete(id: string) {
    return this.prisma.costCategory.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /** Renaming must carry through to the denormalized `detailKey` copy on every package row using it. */
  async syncDetailKey(id: string, name: string) {
    return this.prisma.costDetail.updateMany({ where: { costCategoryId: id }, data: { detailKey: name } });
  }
}
