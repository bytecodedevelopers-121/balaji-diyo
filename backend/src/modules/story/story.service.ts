import { Prisma } from '@prisma/client';
import { StoryRepository } from './story.repository';
import { CreateStoryDtoType, UpdateStoryDtoType, GetStoriesDtoType, GetStoriesAdminDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { slugify } from '../../lib/slugify';
import { assertInTrash, runHardDelete } from '../../lib/hard-delete';

export class StoryService {
  constructor(private repository: StoryRepository) {}

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
        throw new ApiError(400, 'One or more referenced authors do not exist');
      }
      throw err;
    }
  }

  async create(dto: CreateStoryDtoType) {
    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.title);
    return this.runWrite(() => this.repository.create({ ...dto, slug }));
  }

  async findAllPublic(dto: GetStoriesDtoType) {
    return this.list(dto, { isActive: true, deletedAt: null });
  }

  async findAllAdmin(dto: GetStoriesAdminDtoType) {
    const where: Prisma.StoryWhereInput = { deletedAt: dto.includeTrashed ? { not: null } : null };
    if (dto.isActive !== undefined) where.isActive = dto.isActive;
    return this.list(dto, where);
  }

  private async list(dto: GetStoriesDtoType, extraWhere: Prisma.StoryWhereInput) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.StoryWhereInput = {
      ...extraWhere,
      ...(dto.search ? { title: { contains: dto.search, mode: 'insensitive' } } : {}),
      ...(dto.authorId ? { authors: { some: { id: dto.authorId } } } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findPublicBySlug(slug: string) {
    const story = await this.repository.findBySlug(slug, { isActive: true, deletedAt: null });
    if (!story) throw new ApiError(404, 'Story not found');
    return story;
  }

  async findById(id: string) {
    const story = await this.repository.findById(id);
    if (!story || story.deletedAt) throw new ApiError(404, 'Story not found');
    return story;
  }

  async update(id: string, dto: UpdateStoryDtoType) {
    await this.findById(id);
    const slug = dto.slug || dto.title ? await this.resolveUniqueSlug(dto.slug ?? dto.title!, id) : undefined;

    return this.runWrite(() => this.repository.update(id, { ...dto, slug }));
  }

  async remove(id: string) {
    await this.findById(id);
    await this.repository.softDelete(id);
  }

  async restore(id: string) {
    const story = await this.repository.findById(id);
    if (!story) throw new ApiError(404, 'Story not found');
    await this.repository.restore(id);
  }

  async hardDelete(id: string) {
    assertInTrash(await this.repository.findById(id), 'Story');
    await runHardDelete(() => this.repository.hardDelete(id));
  }
}
