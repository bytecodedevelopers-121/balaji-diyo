import { prisma, queryAll, bool, nullIfEmpty } from '../db';
import { idMap } from '../id-map';
import { report } from '../report';
import { resolveOwner } from '../owner-map';

interface MetaRow {
  id: number;
  meta_title: string;
  meta_keywords: string | null;
  meta_description: string | null;
  status: number;
  metadata_id: number;
  metadata_type: string;
}

interface UrlRow {
  id: number;
  url_title: string | null;
  url_slug: string;
  canonical: string | null;
  urldata_type: string;
  urldata_id: number;
  status: number;
}

// Runs last — every owner entity (packages, blogs, categories, team members,
// testimonials, trip infos, pages, itineraries, package-maps) must already
// exist for the polymorphic ownerType/ownerId pair to resolve.
export async function importMetaAndUrl(): Promise<void> {
  const metaRows = await queryAll<MetaRow>('SELECT * FROM base_meta');
  let metaCount = 0;
  for (const row of metaRows) {
    let owner;
    try {
      owner = resolveOwner(idMap, row.metadata_type, row.metadata_id);
    } catch (err) {
      console.warn(`  base_meta#${row.id}: ${(err as Error).message}`);
      continue;
    }
    if (!owner) continue;
    try {
      await prisma.meta.create({
        data: {
          ownerType: owner.ownerType,
          ownerId: owner.ownerId,
          metaTitle: nullIfEmpty(row.meta_title),
          metaKeywords: nullIfEmpty(row.meta_keywords),
          metaDescription: nullIfEmpty(row.meta_description),
          isActive: bool(row.status, true),
        },
      });
      metaCount++;
    } catch (err) {
      // @@unique([ownerType, ownerId]) — legacy has no such constraint, so a
      // handful of owners may have more than one meta row. First wins.
      console.warn(`  base_meta#${row.id}: duplicate for ${owner.ownerType}#${owner.ownerId}, skipped — ${(err as Error).message}`);
    }
  }
  report.record('base_meta', metaRows.length, metaCount);

  const urlRows = await queryAll<UrlRow>('SELECT * FROM base_url');
  let urlCount = 0;
  for (const row of urlRows) {
    let owner;
    try {
      owner = resolveOwner(idMap, row.urldata_type, row.urldata_id);
    } catch (err) {
      console.warn(`  base_url#${row.id}: ${(err as Error).message}`);
      continue;
    }
    if (!owner) continue;
    try {
      await prisma.urlInfo.create({
        data: {
          ownerType: owner.ownerType,
          ownerId: owner.ownerId,
          urlTitle: nullIfEmpty(row.url_title),
          urlSlug: row.url_slug,
          canonical: nullIfEmpty(row.canonical),
        },
      });
      urlCount++;
    } catch (err) {
      // @@unique([ownerType, ownerId]) and @@unique([ownerType, urlSlug]) —
      // legacy has neither constraint. First wins, rest logged.
      console.warn(`  base_url#${row.id}: conflict for ${owner.ownerType}#${owner.ownerId} / slug "${row.url_slug}", skipped — ${(err as Error).message}`);
    }
  }
  report.record('base_url', urlRows.length, urlCount);
}
