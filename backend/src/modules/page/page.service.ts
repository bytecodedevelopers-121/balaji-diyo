import { Prisma } from '@prisma/client';
import { PageRepository } from './page.repository';
import { CreatePageDtoType, UpdatePageDtoType, GetPagesDtoType, GetPagesAdminDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { slugify } from '../../lib/slugify';
import { revalidateFrontendTags } from '../../lib/revalidate-frontend';
import { assertInTrash, runHardDelete } from '../../lib/hard-delete';

const REVALIDATE_TAG = 'cms-pages';

export class PageService {
  constructor(private repository: PageRepository) {}

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
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ApiError(400, 'Invalid parentId');
      }
      throw err;
    }
  }

  async create(dto: CreatePageDtoType) {
    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.title);

    const page = await this.runWrite(() =>
      this.repository.create({
        title: dto.title,
        content: dto.content ?? null,
        pageOrder: dto.pageOrder ?? 0,
        isActive: dto.isActive ?? true,
        parentId: dto.parentId ?? null,
        linkedPagePath: dto.linkedPagePath ?? null,
        linkedPageLabel: dto.linkedPageLabel ?? null,
        slug,
        metaTitle: dto.metaTitle ?? null,
        metaKeywords: dto.metaKeywords ?? null,
        metaDescription: dto.metaDescription ?? null,
      }),
    );
    void revalidateFrontendTags([REVALIDATE_TAG, `cms-page:${slug}`]);
    return page;
  }

  async findAllPublic(dto: GetPagesDtoType) {
    return this.list(dto, { isActive: true, deletedAt: null });
  }

  async findAllAdmin(dto: GetPagesAdminDtoType) {
    const where: Prisma.PageWhereInput = { deletedAt: dto.includeTrashed ? { not: null } : null };
    if (dto.isActive !== undefined) where.isActive = dto.isActive;
    return this.list(dto, where);
  }

  private async list(dto: GetPagesDtoType, statusFilter: Prisma.PageWhereInput) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.PageWhereInput = {
      ...statusFilter,
      ...(dto.search ? { title: { contains: dto.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findPublicBySlug(slug: string) {
    const page = await this.repository.findBySlug(slug, { isActive: true, deletedAt: null });
    if (!page) throw new ApiError(404, 'Page not found');
    return page;
  }

  async findById(id: string) {
    const page = await this.repository.findById(id);
    if (!page || page.deletedAt) throw new ApiError(404, 'Page not found');
    return page;
  }

  async update(id: string, dto: UpdatePageDtoType) {
    const existing = await this.findById(id);

    const slug = dto.slug || dto.title ? await this.resolveUniqueSlug(dto.slug ?? dto.title!, id) : undefined;

    const page = await this.runWrite(() => this.repository.update(id, { ...dto, slug }));
    // Revalidate both the old and new slug: renaming a page leaves the
    // previous slug's cached entry behind otherwise.
    const slugs = [...new Set([existing.slug, page.slug].filter(Boolean))] as string[];
    void revalidateFrontendTags([REVALIDATE_TAG, ...slugs.map((s) => `cms-page:${s}`)]);
    return page;
  }

  async remove(id: string) {
    const existing = await this.findById(id);
    await this.repository.softDelete(id);
    void revalidateFrontendTags(
      existing.slug ? [REVALIDATE_TAG, `cms-page:${existing.slug}`] : [REVALIDATE_TAG],
    );
  }

  async restore(id: string) {
    const page = await this.repository.findById(id);
    if (!page) throw new ApiError(404, 'Page not found');
    const restored = await this.repository.restore(id);
    void revalidateFrontendTags(
      page.slug ? [REVALIDATE_TAG, `cms-page:${page.slug}`] : [REVALIDATE_TAG],
    );
    return restored;
  }

  async hardDelete(id: string) {
    assertInTrash(await this.repository.findById(id), 'Page');
    const childCount = await this.repository.countChildrenIncludingTrashed(id);
    if (childCount > 0) {
      throw new ApiError(409, `Cannot delete permanently: ${childCount} child pages still belong to this page`);
    }
    await runHardDelete(() => this.repository.hardDelete(id));
  }
}
