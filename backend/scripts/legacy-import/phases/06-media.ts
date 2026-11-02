import { prisma, queryAll, bool, nullIfEmpty } from '../db';
import { idMap } from '../id-map';
import { report } from '../report';
import { resolveMediaPath } from '../media-path';
import { resolveOwner } from '../owner-map';

// Runs after every other phase — Attachment/Meta/UrlInfo rows are *owned by*
// packages/blogs/team members/etc., so their owners must already exist for
// polymorphic resolution to succeed (see index.ts for the actual run order).

interface MediaLibraryRow {
  id: number;
  mime: string;
  extension: string;
  alt_text: string | null;
  caption: string | null;
  full_name: string;
  full_path: string;
  status: number;
}

async function importMediaLibrary(): Promise<void> {
  const rows = await queryAll<MediaLibraryRow>('SELECT * FROM base_media');
  let count = 0;
  for (const row of rows) {
    const created = await prisma.media.create({
      data: {
        mime: row.mime,
        extension: row.extension,
        altText: nullIfEmpty(row.alt_text),
        caption: nullIfEmpty(row.caption),
        fullName: row.full_name,
        fullPath: resolveMediaPath(row.full_path) ?? row.full_path,
        isActive: bool(row.status, true),
      },
    });
    idMap.set('media', row.id, created.id);
    count++;
  }
  report.record('base_media', rows.length, count);
}

// Shape shared by base_avatars/base_banners/base_single_banners/
// base_featured_images — each row is simultaneously a Media (the image
// itself) and its one Attachment (who it belongs to), unlike base_media which
// is a plain library that base_attachments points into separately.
interface OwnedImageRow {
  id: number;
  owner_id: number;
  owner_type: string;
  mime: string;
  extension: string;
  alt_text: string | null;
  caption: string | null;
  full_name: string;
  full_path: string;
  thumb_name: string | null;
  thumb_path: string | null;
  status: number;
}

async function importOwnedImageTable(
  table: string,
  ownerIdCol: string,
  ownerTypeCol: string,
  role: string,
): Promise<void> {
  const rows = await queryAll<OwnedImageRow>(
    `SELECT id, ${ownerIdCol} AS owner_id, ${ownerTypeCol} AS owner_type, mime, extension, alt_text, caption, full_name, full_path, thumb_name, thumb_path, status FROM ${table}`,
  );
  let count = 0;
  for (const row of rows) {
    let owner;
    try {
      owner = resolveOwner(idMap, row.owner_type, row.owner_id);
    } catch (err) {
      console.warn(`  ${table}#${row.id}: ${(err as Error).message}`);
      continue;
    }
    if (!owner) {
      console.warn(`  ${table}#${row.id}: owner ${row.owner_type}#${row.owner_id} not migrated, skipped`);
      continue;
    }
    const media = await prisma.media.create({
      data: {
        mime: row.mime,
        extension: row.extension,
        altText: nullIfEmpty(row.alt_text),
        caption: nullIfEmpty(row.caption),
        fullName: row.full_name,
        fullPath: resolveMediaPath(row.full_path) ?? row.full_path,
        thumbName: nullIfEmpty(row.thumb_name),
        thumbPath: resolveMediaPath(row.thumb_path),
        isActive: bool(row.status, true),
      },
    });
    await prisma.attachment.create({
      data: {
        mediaId: media.id,
        role: role as never,
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
        isActive: bool(row.status, true),
      },
    });
    count++;
  }
  report.record(table, rows.length, count);
}

interface CarouselRow {
  id: number;
  carouselcontent_id: number;
  carouselcontent_type: string;
}
interface CarouselContentRow {
  id: number;
  carousel_id: number;
  mime: string | null;
  extension: string | null;
  alt_text: string | null;
  caption: string | null;
  full_name: string | null;
  full_path: string | null;
  thumb_name: string | null;
  thumb_path: string | null;
  content_url: string | null;
  short_description: string | null;
  status: number;
  is_featured: number;
}

async function importCarousel(): Promise<void> {
  const carousels = await queryAll<CarouselRow>('SELECT * FROM base_carousel');
  const owners = new Map<number, { ownerType: string; ownerId: string }>();
  for (const c of carousels) {
    const owner = resolveOwner(idMap, c.carouselcontent_type, c.carouselcontent_id);
    if (owner) owners.set(c.id, owner);
    else console.warn(`  base_carousel#${c.id}: owner ${c.carouselcontent_type}#${c.carouselcontent_id} not migrated`);
  }

  const contents = await queryAll<CarouselContentRow>('SELECT * FROM base_carousel_content');
  let count = 0;
  for (const row of contents) {
    const owner = owners.get(row.carousel_id);
    if (!owner || !row.full_path) continue;
    const media = await prisma.media.create({
      data: {
        mime: row.mime,
        extension: row.extension,
        altText: nullIfEmpty(row.alt_text),
        caption: nullIfEmpty(row.caption),
        fullName: row.full_name ?? `carousel-${row.id}`,
        fullPath: resolveMediaPath(row.full_path) ?? row.full_path,
        thumbName: nullIfEmpty(row.thumb_name),
        thumbPath: resolveMediaPath(row.thumb_path),
        isActive: bool(row.status, true),
      },
    });
    await prisma.attachment.create({
      data: {
        mediaId: media.id,
        role: 'CAROUSEL',
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
        contentUrl: nullIfEmpty(row.content_url),
        shortDescription: nullIfEmpty(row.short_description),
        isFeatured: bool(row.is_featured),
        isActive: bool(row.status, true),
      },
    });
    count++;
  }
  report.record('base_carousel', carousels.length, owners.size);
  report.record('base_carousel_content', contents.length, count);
}

interface ReelRow {
  id: number;
  mediareel_id: number;
  mediareel_type: string;
  caption: string;
  alt_text: string | null;
  thumbnail: string | null;
  reel_url: string | null;
  short_description: string | null;
  status: number;
  is_featured: number;
}

async function importReels(): Promise<void> {
  // base_reels is polymorphic (mediareel_id/type); travel_reels has no owner
  // column at all — both are empty in this dump, so travel_reels is skipped
  // rather than guessing what an ownerless reel would attach to.
  const rows = await queryAll<ReelRow>('SELECT * FROM base_reels');
  let count = 0;
  for (const row of rows) {
    const owner = resolveOwner(idMap, row.mediareel_type, row.mediareel_id);
    if (!owner) {
      console.warn(`  base_reels#${row.id}: owner ${row.mediareel_type}#${row.mediareel_id} not migrated, skipped`);
      continue;
    }
    const media = await prisma.media.create({
      data: {
        fullName: row.caption || `reel-${row.id}`,
        fullPath: resolveMediaPath(row.thumbnail) ?? row.thumbnail ?? '',
        altText: nullIfEmpty(row.alt_text),
        caption: nullIfEmpty(row.caption),
        isActive: bool(row.status, true),
      },
    });
    await prisma.attachment.create({
      data: {
        mediaId: media.id,
        role: 'REEL',
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
        reelUrl: nullIfEmpty(row.reel_url),
        shortDescription: nullIfEmpty(row.short_description),
        isFeatured: bool(row.is_featured),
        isActive: bool(row.status, true),
      },
    });
    count++;
  }
  report.record('base_reels', rows.length, count);
  report.skip('travel_package_reel', 0, 'no legacy rows');
  report.skip('travel_reels', 0, 'ownerless table (no polymorphic owner column), 0 legacy rows');
}

interface GenericAttachmentRow {
  attachable_id: number;
  attachable_type: string;
  attachment_type: string;
  media_id: number;
  status: number;
}

const ATTACHMENT_TYPE_TO_ROLE: Record<string, string> = {
  banners: 'BANNER',
  gallery: 'GALLERY',
};

async function importGenericAttachments(): Promise<void> {
  const rows = await queryAll<GenericAttachmentRow>('SELECT * FROM base_attachments');
  let count = 0;
  for (const row of rows) {
    const owner = resolveOwner(idMap, row.attachable_type, row.attachable_id);
    const mediaId = idMap.get('media', row.media_id);
    if (!owner || !mediaId) {
      console.warn(
        `  base_attachments: ${row.attachable_type}#${row.attachable_id} / media#${row.media_id} unresolved, skipped`,
      );
      continue;
    }
    await prisma.attachment.create({
      data: {
        mediaId,
        role: (ATTACHMENT_TYPE_TO_ROLE[row.attachment_type] ?? 'GALLERY') as never,
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
        isActive: bool(row.status, true),
      },
    });
    count++;
  }
  report.record('base_attachments', rows.length, count);
}

export async function importMedia(): Promise<void> {
  await importMediaLibrary();
  await importOwnedImageTable('base_avatars', 'avatardata_id', 'avatardata_type', 'AVATAR');
  await importOwnedImageTable('base_banners', 'imagebanner_id', 'imagebanner_type', 'BANNER');
  await importOwnedImageTable('base_single_banners', 'singlebanner_id', 'singlebanner_type', 'SINGLE_BANNER');
  await importOwnedImageTable('base_featured_images', 'featuredimage_id', 'featuredimage_type', 'FEATURED');
  await importCarousel();
  await importReels();
  await importGenericAttachments();
}
