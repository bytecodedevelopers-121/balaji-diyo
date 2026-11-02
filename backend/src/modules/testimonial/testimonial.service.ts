import { Prisma } from '@prisma/client';
import { TestimonialRepository } from './testimonial.repository';
import { CreateTestimonialDtoType, UpdateTestimonialDtoType, GetTestimonialsDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { slugify } from '../../lib/slugify';

export class TestimonialService {
  constructor(private repository: TestimonialRepository) {}

  private async resolveUniqueSlug(base: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(base);
    let candidate = baseSlug;
    let suffix = 1;

    for (;;) {
      const taken = await this.repository.slugExists(candidate, excludeId);
      if (!taken) return candidate;
      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }
  }

  private async runWrite<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new ApiError(400, 'One or more referenced packages or members do not exist');
      }
      throw err;
    }
  }

  async create(dto: CreateTestimonialDtoType) {
    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.fullName);
    return this.runWrite(() => this.repository.create({ ...dto, slug }));
  }

  async findAll(dto: GetTestimonialsDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.TestimonialWhereInput = {
      deletedAt: null,
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
      ...(dto.packageId ? { packages: { some: { id: dto.packageId } } } : {}),
      ...(dto.memberId ? { members: { some: { id: dto.memberId } } } : {}),
      ...(dto.search ? { fullName: { contains: dto.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const testimonial = await this.repository.findById(id);
    if (!testimonial || testimonial.deletedAt) throw new ApiError(404, 'Testimonial not found');
    return testimonial;
  }

  async update(id: string, dto: UpdateTestimonialDtoType) {
    await this.findById(id);
    const slug = dto.slug || dto.fullName ? await this.resolveUniqueSlug(dto.slug ?? dto.fullName!, id) : undefined;

    return this.runWrite(() => this.repository.update(id, { ...dto, slug }));
  }

  async remove(id: string) {
    await this.findById(id);
    await this.repository.softDelete(id);
  }
}
