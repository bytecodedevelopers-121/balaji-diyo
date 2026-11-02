import { AttachmentRole } from '@prisma/client';
import { AttachmentRepository } from './attachment.repository';
import { MediaRepository } from '../media/media.repository';
import { CreateAttachmentDtoType, GetAttachmentsDtoType, ReorderAttachmentsDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { revalidateFrontendTags } from '../../lib/revalidate-frontend';
import { packagePaths, packageTags } from '../package/package.service';

// Roles that hold a single image per (ownerType, ownerId) — attaching a new
// one replaces whatever was there. Everything else (GALLERY, CAROUSEL, REEL)
// is an ordered list that a new attachment appends to.
const SINGULAR_ROLES = new Set<AttachmentRole>([
  AttachmentRole.AVATAR,
  AttachmentRole.BANNER,
  AttachmentRole.SINGLE_BANNER,
  AttachmentRole.FEATURED,
  AttachmentRole.MAP,
]);

// Per-day itinerary stop gallery (ItineraryForm's StopGallery — the only
// writer of this ownerType/role pair): up to 3 items total, at most 1 of
// them a video. Enforced here too (not just the admin UI's own cap) so the
// rule holds regardless of caller. Scoped to this one owner type — every
// other GALLERY usage (banner galleries, package galleries, ...) stays
// uncapped, unchanged.
const ITINERARY_DETAIL_OWNER_TYPE = 'itineraryDetail';
const ITINERARY_DETAIL_GALLERY_MAX = 3;
const ITINERARY_DETAIL_GALLERY_MAX_VIDEOS = 1;
const isVideoMedia = (mime: string | null) => mime?.startsWith('video/') ?? false;

export class AttachmentService {
  constructor(
    private repository: AttachmentRepository,
    private mediaRepository: MediaRepository,
  ) {}

  // FIXED: this used to only handle `ownerType === 'place'` — a day's
  // itinerary photo gallery (`ITINERARY_DETAIL_OWNER_TYPE`/its legacy
  // `'itinerary-detail'` spelling, see package.repository.ts's own
  // `findItineraryDetailPhotos` comment on the inconsistency) silently
  // revalidated nothing at all. The owning package's `/[slug]` page is
  // prerendered via `generateStaticParams` with no time-based
  // `revalidate` (package.service.ts's own `packagePaths` comment
  // explains why that path-keyed cache entry needs busting explicitly,
  // not just the tagged data behind it) — so uploading, reordering, or
  // removing a day's photo never showed up on the public page, and
  // real-repro: an itinerary photo that referenced media from *before*
  // an earlier attachment/media migration kept serving that page's
  // original, never-since-revalidated build indefinitely once the
  // package's own fields stopped being touched.
  private async revalidateOwner(ownerType: string, ownerId: string) {
    if (ownerType === 'place') {
      void revalidateFrontendTags(['places', 'attractions']);
      return;
    }
    if (ownerType === ITINERARY_DETAIL_OWNER_TYPE || ownerType === 'itinerary-detail') {
      const slug = await this.repository.findPackageSlugByItineraryDetailId(ownerId).catch(() => null);
      if (slug) void revalidateFrontendTags(packageTags(slug), packagePaths(slug));
    }
  }

  async attach(dto: CreateAttachmentDtoType) {
    const media = await this.mediaRepository.findById(dto.mediaId);
    if (!media) throw ApiError.notFound('Media not found');

    if (dto.ownerType === ITINERARY_DETAIL_OWNER_TYPE && dto.role === AttachmentRole.GALLERY) {
      const existing = await this.repository.findByOwner(dto.ownerType, dto.ownerId, dto.role);
      if (existing.length >= ITINERARY_DETAIL_GALLERY_MAX) {
        throw new ApiError(400, `A day can only have up to ${ITINERARY_DETAIL_GALLERY_MAX} photos/video`);
      }
      if (isVideoMedia(media.mime) && existing.filter((a) => isVideoMedia(a.media.mime)).length >= ITINERARY_DETAIL_GALLERY_MAX_VIDEOS) {
        throw new ApiError(400, `A day can only have ${ITINERARY_DETAIL_GALLERY_MAX_VIDEOS} video`);
      }
    }

    if (SINGULAR_ROLES.has(dto.role)) {
      await this.repository.deleteByOwnerRole(dto.ownerType, dto.ownerId, dto.role);
      const attachment = await this.repository.create({ ...dto, sortOrder: 0 });
      void this.revalidateOwner(dto.ownerType, dto.ownerId);
      return attachment;
    }

    const sortOrder = (await this.repository.maxSortOrder(dto.ownerType, dto.ownerId, dto.role)) + 1;
    const attachment = await this.repository.create({ ...dto, sortOrder });
    void this.revalidateOwner(dto.ownerType, dto.ownerId);
    return attachment;
  }

  async findByOwner(dto: GetAttachmentsDtoType) {
    return this.repository.findByOwner(dto.ownerType, dto.ownerId, dto.role);
  }

  async detach(id: string) {
    const attachment = await this.repository.findById(id);
    if (!attachment) throw ApiError.notFound('Attachment not found');
    await this.repository.delete(id);
    void this.revalidateOwner(attachment.ownerType, attachment.ownerId);
  }

  async reorder(dto: ReorderAttachmentsDtoType) {
    const owners = await this.repository.findByIds(dto.ids);
    await this.repository.reorder(dto.ids);
    // Deduped by the (ownerType, ownerId) *pair*, not just ownerType — a
    // reorder can span attachments from more than one owner (e.g.
    // several packages' itinerary days if `ids` were ever mixed), and
    // itinerary-detail's own revalidation needs the specific ownerId to
    // resolve which package to bust.
    const seen = new Set<string>();
    for (const owner of owners) {
      const key = `${owner.ownerType}:${owner.ownerId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      void this.revalidateOwner(owner.ownerType, owner.ownerId);
    }
  }
}
