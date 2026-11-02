import { prisma, queryAll } from '../db';
import { idMap } from '../id-map';
import { report } from '../report';
import { slugify } from '../utils';
import { bool, nullIfEmpty } from '../db';

interface CategoryTypeRow {
  id: number;
  category_type: string;
  category_key: string;
}

interface CategoryRow {
  id: number;
  type_id: number;
  parent_id: number;
  title: string;
  description: string | null;
  extra_field_1: string | null;
  status: number;
  category_order: number;
}

interface TagRow {
  id: number;
  tag: string;
}

interface MenuTypeRow {
  id: number;
  type_title: string;
  type_key: string;
  status: number;
}

interface MenuItemRow {
  id: number;
  type_id: number;
  parent_id: number;
  item_title: string;
  url_segment: string | null;
  external_link: string | null;
  is_external: number;
  item_order: number | null;
}

// base_menu_pages, despite the name, is the legacy CMS content-pages table
// (App\Models\Admin\Menu\Page) — confirmed via the polymorphic owner classes
// present in base_meta/base_url/base_attachments. Maps to the Page model.
interface MenuPageRow {
  id: number;
  parent_id: number;
  page_title: string;
  page_description: string | null;
  page_order: number | null;
  publish_status: number;
  status: number;
}

export async function importTaxonomy(): Promise<void> {
  // --- CategoryType ---
  const categoryTypes = await queryAll<CategoryTypeRow>('SELECT * FROM base_category_types');
  for (const row of categoryTypes) {
    const created = await prisma.categoryType.upsert({
      where: { key: row.category_key },
      update: { name: row.category_type },
      create: { key: row.category_key, name: row.category_type },
    });
    idMap.set('category-type', row.id, created.id);
  }
  report.record('base_category_types', categoryTypes.length, categoryTypes.length);

  // --- Category (self-referential; two passes: create flat, then link parents) ---
  const categories = await queryAll<CategoryRow>('SELECT * FROM base_categories');
  let categoryCount = 0;
  for (const row of categories) {
    const typeId = idMap.get('category-type', row.type_id);
    if (!typeId) {
      console.warn(`  base_categories#${row.id}: unknown type_id ${row.type_id}, skipped`);
      continue;
    }
    const created = await prisma.category.create({
      data: {
        title: row.title,
        description: nullIfEmpty(row.description),
        extraField1: nullIfEmpty(row.extra_field_1),
        categoryOrder: row.category_order ?? 0,
        isActive: bool(row.status, true),
        typeId,
      },
    });
    idMap.set('category', row.id, created.id);
    categoryCount++;
  }
  for (const row of categories) {
    if (row.parent_id === 0) continue;
    const childId = idMap.get('category', row.id);
    const parentId = idMap.get('category', row.parent_id);
    if (!childId || !parentId) continue;
    await prisma.category.update({ where: { id: childId }, data: { parentId } });
  }
  report.record('base_categories', categories.length, categoryCount);

  // --- Tag ---
  const tags = await queryAll<TagRow>('SELECT * FROM base_blog_tags');
  let tagCount = 0;
  for (const row of tags) {
    const created = await prisma.tag.create({
      data: { name: row.tag, slug: slugify(row.tag) || `tag-${row.id}` },
    });
    idMap.set('tag', row.id, created.id);
    tagCount++;
  }
  report.record('base_blog_tags', tags.length, tagCount);

  // --- MenuType ---
  const menuTypes = await queryAll<MenuTypeRow>('SELECT * FROM base_menu_types');
  for (const row of menuTypes) {
    const created = await prisma.menuType.upsert({
      where: { key: row.type_key },
      update: { name: row.type_title },
      create: { key: row.type_key, name: row.type_title },
    });
    idMap.set('menu-type', row.id, created.id);
  }
  report.record('base_menu_types', menuTypes.length, menuTypes.length);

  // --- MenuItem (self-referential; two passes like Category) ---
  const menuItems = await queryAll<MenuItemRow>('SELECT * FROM base_menu_items');
  let menuItemCount = 0;
  for (const row of menuItems) {
    const typeId = idMap.get('menu-type', row.type_id);
    if (!typeId) {
      console.warn(`  base_menu_items#${row.id}: unknown type_id ${row.type_id}, skipped`);
      continue;
    }
    const created = await prisma.menuItem.create({
      data: {
        itemOrder: row.item_order ?? 0,
        label: row.item_title,
        isExternal: bool(row.is_external),
        externalLink: nullIfEmpty(row.external_link),
        urlSegment: nullIfEmpty(row.url_segment),
        typeId,
      },
    });
    idMap.set('menu-item', row.id, created.id);
    menuItemCount++;
  }
  for (const row of menuItems) {
    if (row.parent_id === 0) continue;
    const childId = idMap.get('menu-item', row.id);
    const parentId = idMap.get('menu-item', row.parent_id);
    if (!childId || !parentId) continue;
    await prisma.menuItem.update({ where: { id: childId }, data: { parentId } });
  }
  report.record('base_menu_items', menuItems.length, menuItemCount);

  // --- Page (from base_menu_pages; self-referential like Category) ---
  const pages = await queryAll<MenuPageRow>('SELECT * FROM base_menu_pages');
  let pageCount = 0;
  for (const row of pages) {
    const created = await prisma.page.create({
      data: {
        title: row.page_title,
        content: nullIfEmpty(row.page_description),
        pageOrder: row.page_order ?? 0,
        isActive: bool(row.status, true) && bool(row.publish_status, true),
      },
    });
    idMap.set('page', row.id, created.id);
    pageCount++;
  }
  for (const row of pages) {
    if (row.parent_id === 0) continue;
    const childId = idMap.get('page', row.id);
    const parentId = idMap.get('page', row.parent_id);
    if (!childId || !parentId) continue;
    await prisma.page.update({ where: { id: childId }, data: { parentId } });
  }
  report.record('base_menu_pages', pages.length, pageCount);
}
