import { Prisma } from '@prisma/client';
import { GalleryAlbumRepository } from './gallery-album.repository';
import { CreateGalleryAlbumDtoType, UpdateGalleryAlbumDtoType, GetGalleryAlbumsDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { slugify } from '../../lib/slugify';
import { revalidateFrontendTags } from '../../lib/revalidate-frontend';

const REVALIDATE_TAGS = ['gallery-albums', 'gallery'];

export class GalleryAlbumService {
  constructor(private repository: GalleryAlbumRepository) {}

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

  private async validateDestination(destinationId: string | undefined) {
    if (destinationId === undefined) return;
    const isValid = await this.repository.destinationIsValid(destinationId);
    if (!isValid) throw new ApiError(400, 'Destination must be a valid destination category');
  }

  private async runWrite<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === 'P2003' || err.code === 'P2025')
      ) {
        throw new ApiError(400, 'The referenced destination does not exist');
      }
      throw err;
    }
  }

  async create(dto: CreateGalleryAlbumDtoType) {
    await this.validateDestination(dto.destinationId);
    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.title);
    const album = await this.runWrite(() => this.repository.create({ ...dto, slug }));
    void revalidateFrontendTags([...REVALIDATE_TAGS, `gallery-album:${slug}`]);
    return album;
  }

  async findAll(dto: GetGalleryAlbumsDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.GalleryAlbumWhereInput = {
      deletedAt: null,
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
      ...(dto.search ? { title: { contains: dto.search, mode: 'insensitive' } } : {}),
      ...(dto.destinationId ? { destinationId: dto.destinationId } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const album = await this.repository.findById(id);
    if (!album || album.deletedAt) throw new ApiError(404, 'Gallery album not found');
    return album;
  }

  async findPublicBySlug(slug: string) {
    const album = await this.repository.findBySlug(slug, { isActive: true, deletedAt: null });
    if (!album) throw new ApiError(404, 'Gallery album not found');
    const [coverPaths, galleryImages] = await Promise.all([
      this.repository.findCoverImagePaths([album.id]),
      this.repository.findGalleryImages(album.id),
    ]);
    return { ...album, imageUrl: coverPaths.get(album.id) ?? null, galleryImages };
  }

  async findShowcase() {
    const albums = await this.repository.findShowcase();
    const albumIds = albums.map((album) => album.id);
    const [coverPaths, photoPathsByAlbum] = await Promise.all([
      this.repository.findCoverImagePaths(albumIds),
      this.repository.findAlbumPhotoPaths(albumIds),
    ]);
    const albumsWithImages = albums.map((album) => ({ ...album, imageUrl: coverPaths.get(album.id) ?? null }));

    // `images` is every album's cover + gallery photos flattened for the
    // whole destination — not one cover per album — so a destination
    // with a single, photo-rich album (the common case early on) still
    // gets a real mosaic instead of a single tile. Albums iterate in
    // their own displayOrder, so a destination with several albums gets
    // each album's photos in that same order. Each photo carries its
    // owning album's `albumSlug` (not just a bare URL) so the /gallery
    // page's photo-mosaic tiles can still link back into that album's
    // full page — the mosaic itself has no per-tile title/caption
    // (matches the design as given), so without this the album detail
    // pages would have no way to be reached from /gallery at all.
    const destinationMap = new Map<
      string,
      {
        id: string;
        title: string;
        categoryOrder: number;
        albums: typeof albumsWithImages;
        images: { url: string; albumSlug: string | null }[];
      }
    >();
    for (const album of albumsWithImages) {
      const destination = album.destination;
      const group = destinationMap.get(destination.id) ?? {
        id: destination.id,
        title: destination.title,
        categoryOrder: destination.categoryOrder,
        albums: [],
        images: [],
      };
      group.albums.push(album);
      group.images.push(
        ...(photoPathsByAlbum.get(album.id) ?? []).map((url) => ({ url, albumSlug: album.slug })),
      );
      destinationMap.set(destination.id, group);
    }

    return {
      featuredAlbums: albumsWithImages.filter((album) => album.isFeatured),
      destinations: [...destinationMap.values()].sort(
        (a, b) => a.categoryOrder - b.categoryOrder || a.title.localeCompare(b.title),
      ),
    };
  }

  async update(id: string, dto: UpdateGalleryAlbumDtoType) {
    await this.findById(id);
    await this.validateDestination(dto.destinationId);
    const slug = dto.slug || dto.title ? await this.resolveUniqueSlug(dto.slug ?? dto.title!, id) : undefined;

    const album = await this.runWrite(() => this.repository.update(id, { ...dto, slug }));
    void revalidateFrontendTags([
      ...REVALIDATE_TAGS,
      ...[album.slug].filter((value): value is string => Boolean(value)).map((value) => `gallery-album:${value}`),
    ]);
    return album;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.repository.softDelete(id);
    void revalidateFrontendTags(REVALIDATE_TAGS);
  }
}
