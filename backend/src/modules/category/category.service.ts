import { Prisma } from '@prisma/client';
import { CategoryRepository } from './category.repository';
import { CategoryTypeRepository } from '../category-type/category-type.repository';
import { CreateCategoryDtoType, UpdateCategoryDtoType, GetCategoriesDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { slugify } from '../../lib/slugify';
import { revalidateFrontendTags } from '../../lib/revalidate-frontend';
import { assertInTrash, runHardDelete } from '../../lib/hard-delete';

// Matches the frontend's own tags exactly (frontend/src/features/trips/api/
// get-category-by-slug.ts) — this only covers the category's own
// title/description/slug. A package's category *membership* changing is
// revalidated from package.service.ts (the "trips" tag), not here.
function categoryTags(slug: string | null | undefined) {
  return ['categories', ...(slug ? [`category:${slug}`] : [])];
}

export class CategoryService {
  constructor(
    private repository: CategoryRepository,
    private typeRepository: CategoryTypeRepository,
  ) {}

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
        throw new ApiError(400, 'Invalid typeId or parentId');
      }
      throw err;
    }
  }

  private async assertValidType(typeId: string) {
    const type = await this.typeRepository.findById(typeId);
    if (!type || type.deletedAt) throw new ApiError(400, 'Invalid typeId');
  }

  private async assertValidParent(parentId: string, excludeId?: string) {
    const parent = await this.repository.findById(parentId);
    if (!parent) throw new ApiError(400, 'Invalid parentId');

    if (excludeId) {
      if (parentId === excludeId) throw new ApiError(400, 'A category cannot be its own parent');
      if (await this.repository.isAncestorOf(excludeId, parentId)) {
        throw new ApiError(400, 'That parent is a descendant of this category — would create a cycle');
      }
    }
  }

  async create(dto: CreateCategoryDtoType) {
    await this.assertValidType(dto.typeId);
    if (dto.parentId) await this.assertValidParent(dto.parentId);

    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.title);

    const category = await this.runWrite(() =>
      this.repository.create({
        title: dto.title,
        description: dto.description ?? null,
        extraField1: dto.extraField1 ?? null,
        categoryOrder: dto.categoryOrder ?? 0,
        isActive: dto.isActive ?? true,
        typeId: dto.typeId,
        parentId: dto.parentId ?? null,
        slug,
        metaTitle: dto.metaTitle ?? null,
        metaKeywords: dto.metaKeywords ?? null,
        metaDescription: dto.metaDescription ?? null,
      }),
    );
    void revalidateFrontendTags(categoryTags(slug));
    return category;
  }

  async findAll(dto: GetCategoriesDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.CategoryWhereInput = {
      deletedAt: dto.includeTrashed ? { not: null } : null,
      ...(dto.typeId ? { typeId: dto.typeId } : {}),
      ...(dto.parentId ? { parentId: dto.parentId === 'root' ? null : dto.parentId } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.extraField1 ? { extraField1: dto.extraField1 } : {}),
      ...(dto.hasPackages ? { packages: { some: { deletedAt: null } } } : {}),
      ...(dto.search ? { title: { contains: dto.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    const publicItems = await this.withPublicFields(items);
    return PaginationDto.create({ items: publicItems, page: pagination.page, perPage: pagination.perPage, total });
  }

  private async withPublicFields<T extends { id: string }>(items: T[]) {
    const ids = items.map((item) => item.id);
    const [imagePaths, packageCounts] = await Promise.all([
      this.repository.findFeaturedImagePaths(ids),
      this.repository.findActivePackageCounts(ids),
    ]);
    return items.map((item) => ({
      ...item,
      imageUrl: imagePaths.get(item.id) ?? null,
      packageCount: packageCounts.get(item.id) ?? 0,
    }));
  }

  async findPublicBySlug(slug: string) {
    const category = await this.repository.findBySlug(slug, { isActive: true, deletedAt: null });
    if (!category) throw new ApiError(404, 'Category not found');
    const [result] = await this.withPublicFields([category]);
    return result;
  }

  async findTree(typeId: string) {
    await this.assertValidType(typeId);
    return this.repository.findTree(typeId);
  }

  async findById(id: string) {
    const category = await this.repository.findById(id);
    if (!category || category.deletedAt) throw new ApiError(404, 'Category not found');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDtoType) {
    const existing = await this.findById(id);

    if (dto.typeId) await this.assertValidType(dto.typeId);
    if (dto.parentId) await this.assertValidParent(dto.parentId, id);

    const slug = dto.slug || dto.title ? await this.resolveUniqueSlug(dto.slug ?? dto.title!, id) : undefined;

    const updated = await this.runWrite(() => this.repository.update(id, { ...dto, slug }));
    const slugs = [...new Set([existing.slug, updated.slug].filter(Boolean))] as string[];
    void revalidateFrontendTags(['categories', ...slugs.map((s) => `category:${s}`)]);
    return updated;
  }

  async remove(id: string) {
    const existing = await this.findById(id);

    const childCount = await this.repository.countChildren(id);
    if (childCount > 0) throw new ApiError(409, `Cannot delete: ${childCount} child categories exist`);

    await this.repository.softDelete(id);
    void revalidateFrontendTags(categoryTags(existing.slug));
  }

  async restore(id: string) {
    const category = await this.repository.findById(id);
    if (!category) throw new ApiError(404, 'Category not found');

    await this.repository.restore(id);
    void revalidateFrontendTags(categoryTags(category.slug));
  }

  async bulkRemove(ids: string[]) {
    await this.repository.bulkSoftDelete(ids);
    void revalidateFrontendTags(['categories']);
  }

  async hardDelete(id: string) {
    assertInTrash(await this.repository.findById(id), 'Category');
    const childCount = await this.repository.countChildrenIncludingTrashed(id);
    if (childCount > 0) {
      throw new ApiError(409, `Cannot delete permanently: ${childCount} child categories still belong to this category`);
    }
    await runHardDelete(() => this.repository.hardDelete(id));
  }
}
