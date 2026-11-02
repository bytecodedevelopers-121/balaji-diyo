import { AttachmentRole, PrismaClient } from '@prisma/client';

/**
 * Resolves each owner's own image straight from the Attachment/Media
 * tables, bypassing the authenticated `GET /attachments` endpoint (not
 * the underlying data) for public reads that need to embed an image URL
 * — e.g. a trip map's route graphic or a blog post's cover photo.
 *
 * Extracted from package-map.repository.ts's original `findFeaturedImagePaths`
 * (added for /trekking-routes-map-of-nepal, 2026-08-20) once blog.repository.ts
 * needed the exact same thing for /blog: both modules' real, legacy-migrated
 * data uses more than one Attachment `role` for what the admin UI treats as
 * a single "the" image (package-map: mostly BANNER, a few FEATURED; blog:
 * mostly FEATURED, a few SINGLE_BANNER) — `preferredRoles` is the priority
 * order to check, first match wins per owner.
 *
 * Returns each Media.fullPath as-is (not yet a URL) — callers turn it into
 * an absolute one via toAbsolutePublicFileUrl (this same lib/media.ts),
 * which does the "/files/public/" prefixing, so it isn't duplicated here.
 */
export async function findAttachmentImagePaths(
  prisma: PrismaClient,
  ownerType: string,
  ownerIds: string[],
  preferredRoles: AttachmentRole[],
): Promise<Map<string, string>> {
  if (ownerIds.length === 0) return new Map();

  const attachments = await prisma.attachment.findMany({
    where: { ownerType, ownerId: { in: ownerIds }, role: { in: preferredRoles } },
    include: { media: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });

  const paths = new Map<string, string>();
  const pathRoleRank = new Map<string, number>();
  for (const attachment of attachments) {
    const rank = preferredRoles.indexOf(attachment.role);
    const currentRank = pathRoleRank.get(attachment.ownerId);
    // Keep whichever attachment already recorded for this owner unless
    // this one outranks it (lower index in preferredRoles = higher
    // priority) — a same-rank duplicate keeps the first (lowest
    // sortOrder) one seen.
    if (currentRank !== undefined && currentRank <= rank) continue;
    paths.set(attachment.ownerId, attachment.media.fullPath);
    pathRoleRank.set(attachment.ownerId, rank);
  }
  return paths;
}
