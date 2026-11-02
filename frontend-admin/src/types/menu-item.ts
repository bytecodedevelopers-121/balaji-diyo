export interface MenuItem {
  id: string;
  itemOrder: number;
  label: string;
  isExternal: boolean;
  externalLink: string | null;
  urlSegment: string | null;
  isActive: boolean;
  typeId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// GET /menu-items/tree/:typeId — root items with 2 nested levels of children.
export interface MenuItemTreeNode extends MenuItem {
  children: (MenuItem & { children: MenuItem[] })[];
}

export interface CreateMenuItemDto {
  typeId: string;
  label: string;
  itemOrder?: number;
  isExternal?: boolean;
  externalLink?: string;
  urlSegment?: string;
  isActive?: boolean;
  parentId?: string;
}

export interface UpdateMenuItemDto {
  label?: string;
  itemOrder?: number;
  isExternal?: boolean;
  externalLink?: string;
  urlSegment?: string;
  isActive?: boolean;
}
