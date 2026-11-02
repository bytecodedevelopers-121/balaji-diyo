import { AttachmentRole, Prisma, PrismaClient } from '@prisma/client';
import { findAttachmentImagePaths } from '../../lib/attachment-images';
import { deleteOwnedRows } from '../../lib/hard-delete';

const OWNER_TYPE = 'blog';

const blogInclude = {
  authors: true,
  categories: true,
  tags: true,
  places: true,
} satisfies Prisma.BlogInclude;

export interface BlogCoreFields {
  title: string;
  abstract?: string | null;
  content: string;
  blogDate: Date;
  isActive?: boolean;
}

export interface BlogRelationFields {
  authorIds?: string[];
  categoryIds?: string[];
  tagIds?: string[];
  placeIds?: string[];
}

export interface BlogSeoFields {
  slug?: string;
  metaTitle?: string | null;
  metaKeywords?: string | null;
  metaDescription?: string | null;
}

export type BlogCreateData = BlogCoreFields & BlogRelationFields & BlogSeoFields;
export type BlogUpdateData = Partial<BlogCoreFields> & BlogRelationFields & BlogSeoFields;

const toConnect = (ids?: string[]) => (ids ? { connect: ids.map((id) => ({ id })) } : undefined);
const toSet = (ids?: string[]) => (ids ? { set: ids.map((id) => ({ id })) } : undefined);

export class BlogRepository {
  constructor(private prisma: PrismaClient) {}

  private async attachSeo(blogId: string) {
    const [urlInfo, meta] = await Promise.all([
      this.prisma.urlInfo.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: blogId } } }),
      this.prisma.meta.findUnique({ where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: blogId } } }),
    ]);
    return { urlInfo, meta };
  }

  private async withSeo<T extends { id: string }>(blog: T) {
    const { urlInfo, meta } = await this.attachSeo(blog.id);
    return { ...blog, slug: urlInfo?.urlSlug ?? null, meta };
  }

  async create(data: BlogCreateData) {
    const blog = await this.prisma.$transaction(async (tx) => {
      const created = await tx.blog.create({
        data: {
          title: data.title,
          abstract: data.abstract ?? null,
          content: data.content,
          blogDate: data.blogDate,
          isActive: data.isActive ?? true,
          authors: toConnect(data.authorIds),
          categories: toConnect(data.categoryIds),
          tags: toConnect(data.tagIds),
          places: toConnect(data.placeIds),
        },
        include: blogInclude,
      });

      if (data.slug) {
        await tx.urlInfo.create({
          data: { ownerType: OWNER_TYPE, ownerId: created.id, urlSlug: data.slug, urlTitle: data.title },
        });
      }

      if (data.metaTitle || data.metaKeywords || data.metaDescription) {
        await tx.meta.create({
          data: {
            ownerType: OWNER_TYPE,
            ownerId: created.id,
            metaTitle: data.metaTitle ?? null,
            metaKeywords: data.metaKeywords ?? null,
            metaDescription: data.metaDescription ?? null,
          },
        });
      }

      return created;
    });

    return this.withSeo(blog);
  }

  async update(id: string, data: BlogUpdateData) {
    const blog = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.blog.update({
        where: { id },
        data: {
          title: data.title,
          abstract: data.abstract,
          content: data.content,
          blogDate: data.blogDate,
          isActive: data.isActive,
          authors: toSet(data.authorIds),
          categories: toSet(data.categoryIds),
          tags: toSet(data.tagIds),
          places: toSet(data.placeIds),
        },
        include: blogInclude,
      });

      if (data.slug) {
        await tx.urlInfo.upsert({
          where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } },
          create: { ownerType: OWNER_TYPE, ownerId: id, urlSlug: data.slug, urlTitle: data.title ?? updated.title },
          update: { urlSlug: data.slug, urlTitle: data.title },
        });
      }

      if (data.metaTitle !== undefined || data.metaKeywords !== undefined || data.metaDescription !== undefined) {
        await tx.meta.upsert({
          where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: id } },
          create: {
            ownerType: OWNER_TYPE,
            ownerId: id,
            metaTitle: data.metaTitle ?? null,
            metaKeywords: data.metaKeywords ?? null,
            metaDescription: data.metaDescription ?? null,
          },
          update: {
            metaTitle: data.metaTitle,
            metaKeywords: data.metaKeywords,
            metaDescription: data.metaDescription,
          },
        });
      }

      return updated;
    });

    return this.withSeo(blog);
  }

  async findById(id: string) {
    const blog = await this.prisma.blog.findUnique({ where: { id }, include: blogInclude });
    return blog ? this.withSeo(blog) : null;
  }

  async findBySlug(slug: string, extraWhere: Prisma.BlogWhereInput = {}) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    if (!urlInfo) return null;
    const blog = await this.prisma.blog.findFirst({ where: { id: urlInfo.ownerId, ...extraWhere }, include: blogInclude });
    return blog ? this.withSeo(blog) : null;
  }

  async slugExists(slug: string, excludeId?: string) {
    const urlInfo = await this.prisma.urlInfo.findFirst({ where: { ownerType: OWNER_TYPE, urlSlug: slug } });
    return !!urlInfo && urlInfo.ownerId !== excludeId;
  }

  async findMany(where: Prisma.BlogWhereInput, options?: { skip?: number; take?: number }) {
    const blogs = await this.prisma.blog.findMany({
      where,
      include: blogInclude,
      orderBy: { blogDate: 'desc' },
      ...options,
    });
    return Promise.all(blogs.map((b) => this.withSeo(b)));
  }

  async count(where: Prisma.BlogWhereInput) {
    return this.prisma.blog.count({ where });
  }

  // GET /attachments (where a blog's cover photo lives, as a FEATURED or
  // SINGLE_BANNER Attachment) requires auth — this resolves the same
  // attachment straight from the DB for the public listing/detail pages
  // to embed as `imageUrl`. Checks SINGLE_BANNER as well as FEATURED,
  // preferring SINGLE_BANNER on a tie: of the 242 real, legacy-migrated
  // blog attachments, 237 are FEATURED and 5 are SINGLE_BANNER (confirmed
  // directly against the dev DB) — same two-role situation
  // package-map.repository.ts's own findFeaturedImagePaths hit first,
  // see findAttachmentImagePaths (lib/attachment-images.ts) for the
  // shared resolution logic.
  //
  // SINGLE_BANNER wins the tie (not FEATURED, despite FEATURED being far
  // more common) because the two roles aren't interchangeable quality-
  // wise here: every SINGLE_BANNER attachment found is a real wide banner
  // photo sized for a full-bleed hero (e.g. 1650×650), while FEATURED is
  // a small legacy thumbnail (as little as ~436×369) — some posts (e.g.
  // "Everest Base Camp Trek Helicopter Return Itinerary and Cost") carry
  // both, and the old priority order picked the small FEATURED thumbnail
  // for those even though the real banner was sitting right there,
  // visibly worse than the legacy site's own rendering of the same post.
  findFeaturedImagePaths(blogIds: string[]): Promise<Map<string, string>> {
    return findAttachmentImagePaths(this.prisma, OWNER_TYPE, blogIds, [
      AttachmentRole.SINGLE_BANNER,
      AttachmentRole.FEATURED,
    ]);
  }

  // Companion to findFeaturedImagePaths: which of those resolved image
  // paths came from an actual SINGLE_BANNER attachment (a real wide
  // banner photo) rather than a FEATURED thumbnail. The frontend hero
  // uses this to pick its display treatment — full-bleed `object-cover`
  // for a real banner (safe: it's already sized/shaped for the strip),
  // blurred-backdrop + `object-contain` for a FEATURED-only post (the
  // common case — see BlogDetailSection.tsx for why: a small thumbnail
  // forced to `object-cover` an ultra-wide strip upscales and crops
  // hard, exactly the "pixelated and zoomed in" look this avoids).
  async findWideBannerBlogIds(blogIds: string[]): Promise<Set<string>> {
    if (blogIds.length === 0) return new Set();
    const banners = await this.prisma.attachment.findMany({
      where: { ownerType: OWNER_TYPE, ownerId: { in: blogIds }, role: AttachmentRole.SINGLE_BANNER },
      select: { ownerId: true },
    });
    return new Set(banners.map((b) => b.ownerId));
  }

  async softDelete(id: string) {
    return this.prisma.blog.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restore(id: string) {
    return this.prisma.blog.update({ where: { id }, data: { deletedAt: null } });
  }

  async hardDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.blogComment.deleteMany({ where: { blogId: id } });
      await deleteOwnedRows(tx, OWNER_TYPE, [id]);
      return tx.blog.delete({ where: { id } });
    });
  }
}
