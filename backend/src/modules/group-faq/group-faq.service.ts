import { Prisma } from '@prisma/client';
import { GroupFaqRepository } from './group-faq.repository';
import { CreateGroupFaqDtoType, UpdateGroupFaqDtoType, GetGroupFaqsDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';

export class GroupFaqService {
  constructor(private repository: GroupFaqRepository) {}

  private async runWrite<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new ApiError(400, 'One or more referenced categories do not exist');
      }
      throw err;
    }
  }

  async create(dto: CreateGroupFaqDtoType) {
    return this.runWrite(() => this.repository.create(dto));
  }

  async findAll(dto: GetGroupFaqsDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.GroupFAQWhereInput = {
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.categoryId ? { categories: { some: { id: dto.categoryId } } } : {}),
      ...(dto.search ? { question: { contains: dto.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const faq = await this.repository.findById(id);
    if (!faq) throw new ApiError(404, 'Group FAQ not found');
    return faq;
  }

  async update(id: string, dto: UpdateGroupFaqDtoType) {
    await this.findById(id);
    return this.runWrite(() => this.repository.update(id, dto));
  }

  async remove(id: string) {
    await this.findById(id);
    await this.repository.delete(id);
  }
}
