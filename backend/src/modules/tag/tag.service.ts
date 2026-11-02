import { Prisma } from '@prisma/client';
import { TagRepository } from './tag.repository';
import { CreateTagDtoType, UpdateTagDtoType, GetTagsDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { slugify } from '../../lib/slugify';

export class TagService {
  constructor(private repository: TagRepository) {}

  private async resolveUniqueSlug(base: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(base);
    let candidate = baseSlug;
    let suffix = 1;

    for (;;) {
      const existing = await this.repository.findBySlug(candidate);
      if (!existing || existing.id === excludeId) return candidate;
      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }
  }

  async create(dto: CreateTagDtoType) {
    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.name);

    try {
      return await this.repository.create({ name: dto.name, slug });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ApiError(409, 'A tag with this name already exists');
      }
      throw err;
    }
  }

  async findAll(dto: GetTagsDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.TagWhereInput = dto.search
      ? { name: { contains: dto.search, mode: 'insensitive' } }
      : {};

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const tag = await this.repository.findById(id);
    if (!tag) throw new ApiError(404, 'Tag not found');
    return tag;
  }

  async update(id: string, dto: UpdateTagDtoType) {
    await this.findById(id);
    const slug = dto.slug || dto.name ? await this.resolveUniqueSlug(dto.slug ?? dto.name!, id) : undefined;

    try {
      return await this.repository.update(id, { ...dto, slug });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ApiError(409, 'A tag with this name already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.findById(id);

    const inUse = await this.repository.countBlogs(id);
    if (inUse > 0) throw new ApiError(409, `Cannot delete: ${inUse} blog posts still use this tag`);

    await this.repository.delete(id);
  }
}
