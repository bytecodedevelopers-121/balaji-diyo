import { Prisma } from '@prisma/client';
import { FaqRepository } from './faq.repository';
import { CreateFaqDtoType, UpdateFaqDtoType, GetFaqsDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';

export class FaqService {
  constructor(private repository: FaqRepository) {}

  async create(dto: CreateFaqDtoType) {
    return this.repository.create(dto);
  }

  async findAll(dto: GetFaqsDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.FAQWhereInput = {
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
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
    if (!faq) throw new ApiError(404, 'FAQ not found');
    return faq;
  }

  async update(id: string, dto: UpdateFaqDtoType) {
    await this.findById(id);
    return this.repository.update(id, dto);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.repository.delete(id);
  }

  async bulkRemove(ids: string[]) {
    await this.repository.bulkDelete(ids);
  }
}
