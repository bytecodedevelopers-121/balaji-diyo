import { Prisma } from '@prisma/client';
import { MenuItemRepository } from './menu-item.repository';
import { MenuTypeRepository } from '../menu-type/menu-type.repository';
import { CreateMenuItemDtoType, UpdateMenuItemDtoType, GetMenuItemsDtoType, ReorderMenuItemsDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { revalidateFrontendTags } from '../../lib/revalidate-frontend';

const REVALIDATE_TAG = 'navigation';

export class MenuItemService {
  constructor(
    private repository: MenuItemRepository,
    private typeRepository: MenuTypeRepository,
  ) {}

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
      if (parentId === excludeId) throw new ApiError(400, 'A menu item cannot be its own parent');
      if (await this.repository.isAncestorOf(excludeId, parentId)) {
        throw new ApiError(400, 'That parent is a descendant of this item — would create a cycle');
      }
    }
  }

  async create(dto: CreateMenuItemDtoType) {
    await this.assertValidType(dto.typeId);
    if (dto.parentId) await this.assertValidParent(dto.parentId);

    const item = await this.runWrite(() => this.repository.create(dto));
    void revalidateFrontendTags([REVALIDATE_TAG]);
    return item;
  }

  async findAll(dto: GetMenuItemsDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.MenuItemWhereInput = {
      deletedAt: null,
      ...(dto.typeId ? { typeId: dto.typeId } : {}),
      ...(dto.parentId ? { parentId: dto.parentId === 'root' ? null : dto.parentId } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findTree(typeId: string) {
    await this.assertValidType(typeId);
    return this.repository.findTree(typeId);
  }

  // Public path — the frontend site only knows type *keys*
  // (main_menu/footer_menu), not internal MenuType cuids. Filters to
  // isActive:true, unlike the admin-facing findTree above: this is what
  // actually renders on the public site (see menu-item.routes.ts), so a
  // disabled item (e.g. one of the un-curated legacy-imported rows) must
  // stay hidden here without needing to be soft-deleted.
  async findTreeByKey(key: string) {
    const type = await this.typeRepository.findByKey(key);
    if (!type || type.deletedAt) throw new ApiError(404, 'Menu type not found');

    return this.repository.findTree(type.id, { activeOnly: true });
  }

  async findById(id: string) {
    const item = await this.repository.findById(id);
    if (!item || item.deletedAt) throw new ApiError(404, 'Menu item not found');
    return item;
  }

  async update(id: string, dto: UpdateMenuItemDtoType) {
    await this.findById(id);

    if (dto.typeId) await this.assertValidType(dto.typeId);
    if (dto.parentId) await this.assertValidParent(dto.parentId, id);

    const item = await this.runWrite(() => this.repository.update(id, dto));
    void revalidateFrontendTags([REVALIDATE_TAG]);
    return item;
  }

  // Requires the *complete* sibling set, not a subset — a partial list
  // would leave the omitted siblings on stale `itemOrder` values that
  // collide with the freshly stamped 1..n range.
  async reorder(dto: ReorderMenuItemsDtoType) {
    const siblingIds = await this.repository.findSiblingIds(dto.typeId, dto.parentId);
    const requested = new Set(dto.ids);
    const isExactSet =
      requested.size === dto.ids.length &&
      requested.size === siblingIds.length &&
      siblingIds.every((id) => requested.has(id));
    if (!isExactSet) {
      throw new ApiError(400, 'ids must list every item under this parent exactly once — reload and try again');
    }

    await this.repository.reorder(dto.ids);
    void revalidateFrontendTags([REVALIDATE_TAG]);
  }

  async remove(id: string) {
    await this.findById(id);

    const childCount = await this.repository.countChildren(id);
    if (childCount > 0) throw new ApiError(409, `Cannot delete: ${childCount} child menu items exist`);

    await this.repository.softDelete(id);
    void revalidateFrontendTags([REVALIDATE_TAG]);
  }

  async restore(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new ApiError(404, 'Menu item not found');
    await this.repository.restore(id);
    void revalidateFrontendTags([REVALIDATE_TAG]);
  }
}
