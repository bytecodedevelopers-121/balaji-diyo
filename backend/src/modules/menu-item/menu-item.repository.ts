import { MenuItem, Prisma, PrismaClient } from '@prisma/client';

export interface MenuItemTreeNode extends MenuItem {
  children: MenuItemTreeNode[];
}

export class MenuItemRepository {
  constructor(private prisma: PrismaClient) {}

  create(data: Prisma.MenuItemUncheckedCreateInput) {
    return this.prisma.menuItem.create({ data });
  }

  update(id: string, data: Prisma.MenuItemUncheckedUpdateInput) {
    return this.prisma.menuItem.update({ where: { id }, data });
  }

  findById(id: string) {
    return this.prisma.menuItem.findUnique({ where: { id } });
  }

  findParentId(id: string) {
    return this.prisma.menuItem.findUnique({ where: { id }, select: { parentId: true } }).then((r) => r?.parentId ?? null);
  }

  // Same ancestor-walk cycle guard used by the Category tree.
  async isAncestorOf(ancestorId: string, nodeId: string): Promise<boolean> {
    const seen = new Set<string>();
    let currentParentId = await this.findParentId(nodeId);

    while (currentParentId) {
      if (currentParentId === ancestorId) return true;
      if (seen.has(currentParentId)) break;
      seen.add(currentParentId);
      currentParentId = await this.findParentId(currentParentId);
    }

    return false;
  }

  findMany(where: Prisma.MenuItemWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.menuItem.findMany({
      where,
      orderBy: [{ itemOrder: 'asc' }],
      ...options,
    });
  }

  count(where: Prisma.MenuItemWhereInput) {
    return this.prisma.menuItem.count({ where });
  }

  // Fetches the whole type flat and assembles it into a tree in JS, rather
  // than a fixed-depth Prisma `include` nesting — the real migrated legacy
  // menu data goes 4 levels deep, deeper than any fixed include chain we'd
  // want to hand-write. `activeOnly` is only turned on for the public
  // by-key lookup (see `findTreeByKey` in the service) — the admin tree
  // view still needs to see disabled items so they can be re-enabled.
  async findTree(typeId: string, options?: { activeOnly?: boolean }): Promise<MenuItemTreeNode[]> {
    const items = await this.prisma.menuItem.findMany({
      where: {
        typeId,
        deletedAt: null,
        ...(options?.activeOnly ? { isActive: true } : {}),
      },
      orderBy: { itemOrder: 'asc' },
    });

    const byParent = new Map<string | null, MenuItem[]>();
    for (const item of items) {
      const siblings = byParent.get(item.parentId) ?? [];
      siblings.push(item);
      byParent.set(item.parentId, siblings);
    }

    const build = (parentId: string | null): MenuItemTreeNode[] =>
      (byParent.get(parentId) ?? []).map((item) => ({ ...item, children: build(item.id) }));

    return build(null);
  }

  findSiblingIds(typeId: string, parentId: string | null) {
    return this.prisma.menuItem
      .findMany({ where: { typeId, parentId, deletedAt: null }, select: { id: true } })
      .then((rows) => rows.map((r) => r.id));
  }

  // Bulk-persists a drag-and-drop order for one sibling group (e.g. every
  // package under "NEPAL TOUR PACKAGES") — array index becomes the new
  // `itemOrder`, 1-based to match the migrated legacy data's own numbering.
  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) => this.prisma.menuItem.update({ where: { id }, data: { itemOrder: index + 1 } })),
    );
  }

  countChildren(id: string) {
    return this.prisma.menuItem.count({ where: { parentId: id, deletedAt: null } });
  }

  softDelete(id: string) {
    return this.prisma.menuItem.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  restore(id: string) {
    return this.prisma.menuItem.update({ where: { id }, data: { deletedAt: null } });
  }
}
