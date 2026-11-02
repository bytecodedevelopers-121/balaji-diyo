import { Prisma } from '@prisma/client';
import { BlogRepository } from './blog.repository';
import { CreateBlogDtoType, UpdateBlogDtoType, GetBlogsDtoType, GetBlogsAdminDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { slugify } from '../../lib/slugify';
import { revalidateFrontendTags } from '../../lib/revalidate-frontend';
import { assertInTrash, runHardDelete } from '../../lib/hard-delete';

// Matches the frontend's own tags exactly (frontend/src/features/blogs/api/
// get-blogs.ts, get-blog-by-slug.ts).
function blogTags(slug: string | null | undefined) {
  return ['blogs', ...(slug ? [`blog:${slug}`] : [])];
}

// Matches the frontend's own routes (frontend/src/app/(pages)/blog/[slug]/
// page.tsx, blog/page.tsx) — see revalidate-frontend.ts's own doc comment
// for why `tags` alone doesn't reach a `generateStaticParams`-prerendered
// page's cached HTML.
function blogPaths(slug: string | null | undefined) {
  return ['/blog', ...(slug ? [`/blog/${slug}`] : [])];
}

export class BlogService {
  constructor(private repository: BlogRepository) {}

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
        throw new ApiError(400, 'One or more referenced authors, categories, tags, or places do not exist');
      }
      throw err;
    }
  }

  async create(dto: CreateBlogDtoType) {
    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.title);

    const blog = await this.runWrite(() =>
      this.repository.create({
        title: dto.title,
        abstract: dto.abstract ?? null,
        content: dto.content,
        blogDate: dto.blogDate,
        isActive: dto.isActive ?? true,
        authorIds: dto.authorIds,
        categoryIds: dto.categoryIds,
        tagIds: dto.tagIds,
        placeIds: dto.placeIds,
        slug,
        metaTitle: dto.metaTitle ?? null,
        metaKeywords: dto.metaKeywords ?? null,
        metaDescription: dto.metaDescription ?? null,
      }),
    );
    void revalidateFrontendTags(blogTags(slug), blogPaths(slug));
    return blog;
  }

  async findAllPublic(dto: GetBlogsDtoType) {
    // `findPublicBySlug` and `findAllAdmin` both already filter deletedAt —
    // this one didn't, so the public list (and generateStaticParams, which
    // calls it for the top-30 statically prerendered posts) kept surfacing
    // soft-deleted posts. `package.service.ts`/`story.service.ts` show the
    // right shape (`{ isActive: true, deletedAt: null }`).
    return this.list(dto, { isActive: true, deletedAt: null });
  }

  async findAllAdmin(dto: GetBlogsAdminDtoType) {
    const where: Prisma.BlogWhereInput = { deletedAt: dto.includeTrashed ? { not: null } : null };
    if (dto.isActive !== undefined) where.isActive = dto.isActive;
    return this.list(dto, where);
  }

  private async list(dto: GetBlogsDtoType, extraWhere: Prisma.BlogWhereInput) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.BlogWhereInput = {
      ...extraWhere,
      ...(dto.search ? { title: { contains: dto.search, mode: 'insensitive' } } : {}),
      ...(dto.categoryId ? { categories: { some: { id: dto.categoryId } } } : {}),
      ...(dto.tagId ? { tags: { some: { id: dto.tagId } } } : {}),
      ...(dto.authorId ? { authors: { some: { id: dto.authorId } } } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    // NOTE: `imageUrl` here is still the raw Media.fullPath, not a URL yet
    // — same deliberate half-step as package-map.service.ts's own
    // findAll/findById, which the controller finishes (turns into an
    // absolute URL, or null) right before the response goes out.
    const ids = items.map((item) => item.id);
    const [imagePaths, wideBannerIds] = await Promise.all([
      this.repository.findFeaturedImagePaths(ids),
      this.repository.findWideBannerBlogIds(ids),
    ]);
    const itemsWithImage = items.map((item) => ({
      ...item,
      imageUrl: imagePaths.get(item.id) ?? null,
      imageIsWideBanner: wideBannerIds.has(item.id),
    }));

    return PaginationDto.create({ items: itemsWithImage, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findPublicBySlug(slug: string) {
    const blog = await this.repository.findBySlug(slug, { isActive: true, deletedAt: null });
    if (!blog) throw new ApiError(404, 'Blog not found');
    const [imagePaths, wideBannerIds] = await Promise.all([
      this.repository.findFeaturedImagePaths([blog.id]),
      this.repository.findWideBannerBlogIds([blog.id]),
    ]);
    return {
      ...blog,
      imageUrl: imagePaths.get(blog.id) ?? null,
      imageIsWideBanner: wideBannerIds.has(blog.id),
    };
  }

  async findById(id: string) {
    const blog = await this.repository.findById(id);
    if (!blog || blog.deletedAt) throw new ApiError(404, 'Blog not found');
    return blog;
  }

  async update(id: string, dto: UpdateBlogDtoType) {
    const existing = await this.findById(id);
    const slug = dto.slug || dto.title ? await this.resolveUniqueSlug(dto.slug ?? dto.title!, id) : undefined;

    const updated = await this.runWrite(() => this.repository.update(id, { ...dto, slug }));
    const slugs = [...new Set([existing.slug, updated.slug].filter(Boolean))] as string[];
    void revalidateFrontendTags(
      ['blogs', ...slugs.map((s) => `blog:${s}`)],
      ['/blog', ...slugs.map((s) => `/blog/${s}`)],
    );
    return updated;
  }

  async remove(id: string) {
    const existing = await this.findById(id);
    await this.repository.softDelete(id);
    void revalidateFrontendTags(blogTags(existing.slug), blogPaths(existing.slug));
  }

  async restore(id: string) {
    const blog = await this.repository.findById(id);
    if (!blog) throw new ApiError(404, 'Blog not found');
    await this.repository.restore(id);
    void revalidateFrontendTags(blogTags(blog.slug), blogPaths(blog.slug));
  }

  async hardDelete(id: string) {
    assertInTrash(await this.repository.findById(id), 'Blog');
    await runHardDelete(() => this.repository.hardDelete(id));
  }
}
