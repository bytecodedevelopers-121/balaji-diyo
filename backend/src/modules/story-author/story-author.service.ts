import { Prisma } from '@prisma/client';
import { StoryAuthorRepository } from './story-author.repository';
import { CreateStoryAuthorDtoType, UpdateStoryAuthorDtoType, GetStoryAuthorsDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { slugify } from '../../lib/slugify';

export class StoryAuthorService {
  constructor(private repository: StoryAuthorRepository) {}

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

  async create(dto: CreateStoryAuthorDtoType) {
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) throw new ApiError(409, 'A story author with this email already exists');

    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.name);
    return this.repository.create({ ...dto, slug });
  }

  async findAll(dto: GetStoryAuthorsDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.StoryAuthorWhereInput = {
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.search
        ? { OR: [{ name: { contains: dto.search, mode: 'insensitive' } }, { email: { contains: dto.search, mode: 'insensitive' } }] }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const author = await this.repository.findById(id);
    if (!author) throw new ApiError(404, 'Story author not found');
    return author;
  }

  async update(id: string, dto: UpdateStoryAuthorDtoType) {
    await this.findById(id);

    if (dto.email) {
      const existing = await this.repository.findByEmail(dto.email);
      if (existing && existing.id !== id) throw new ApiError(409, 'A story author with this email already exists');
    }

    const slug = dto.slug || dto.name ? await this.resolveUniqueSlug(dto.slug ?? dto.name!, id) : undefined;
    return this.repository.update(id, { ...dto, slug });
  }

  async remove(id: string) {
    await this.findById(id);

    const inUse = await this.repository.countStories(id);
    if (inUse > 0) throw new ApiError(409, `Cannot delete: ${inUse} stories still credit this author`);

    await this.repository.delete(id);
  }
}
