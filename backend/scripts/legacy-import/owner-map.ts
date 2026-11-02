import { IdMap } from './id-map';

// Legacy polymorphic owner classes (Laravel FQCNs, as they literally appear in
// *_type columns like avatardata_type/metadata_type/urldata_type/attachable_type)
// -> the semantic namespace used both as Attachment/Meta/UrlInfo.ownerType and
// as the IdMap namespace each phase registers its new ids under.
const FQCN_TO_NAMESPACE: Record<string, string> = {
  'App\\Models\\Admin\\Travel\\Package': 'package',
  'App\\Models\\Admin\\Travel\\Itinerary': 'itinerary',
  'App\\Models\\Admin\\Travel\\ItineraryDetail': 'itinerary-detail',
  'App\\Models\\Admin\\Travel\\PackageMap': 'package-map',
  'App\\Models\\Admin\\Travel\\TripInfo': 'trip-info',
  'App\\Models\\Admin\\Blog\\Blog': 'blog',
  'App\\Models\\Admin\\Blog\\BlogAuthor': 'blog-author',
  'App\\Models\\Admin\\Team\\Member': 'team-member',
  'App\\Models\\Admin\\Category\\Category': 'category',
  'App\\Models\\Admin\\Testimonial': 'testimonial',
  'App\\Models\\Admin\\Menu\\Page': 'page',
};

export function ownerNamespace(fqcn: string): string {
  const ns = FQCN_TO_NAMESPACE[fqcn];
  if (!ns) {
    // Unknown owner class — don't invent a mapping silently, surface it so a
    // real decision can be made instead of guessing.
    throw new Error(`owner-map: unrecognized legacy owner class "${fqcn}"`);
  }
  return ns;
}

// Resolves a (fqcn, legacyOwnerId) pair to { ownerType, ownerId } for the new
// schema's Attachment/Meta/UrlInfo rows. Returns null (rather than throwing)
// when the owner row itself wasn't migrated (e.g. referenced a legacy row that
// turned out to be soft-deleted/orphaned) — callers skip and log instead of
// crashing the whole phase over one dangling reference.
export function resolveOwner(
  map: IdMap,
  fqcn: string,
  legacyOwnerId: number,
): { ownerType: string; ownerId: string } | null {
  const ownerType = ownerNamespace(fqcn);
  const ownerId = map.get(ownerType, legacyOwnerId);
  if (!ownerId) return null;
  return { ownerType, ownerId };
}
