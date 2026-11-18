import { randomUUID } from 'crypto';
import { MediaRepository } from './media.repository';
import { FilesService } from '../files/files.service';
import { ApiError } from '../../common/exceptions/api-error';
import { UpdateMediaDtoType, GetMediaDtoType } from './dto';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';

// Fallback subfolder for uploads that don't specify one (older/unknown
// callers) — kept as the original flat default rather than removed, so
// nothing that predates the `folder` param breaks.
const DEFAULT_FOLDER = 'media';

// Video mimetype -> disk extension. Kept local to the service (rather than
// imported from config/multer.ts's own allowlist) since this is about what
// to name the saved file, not about what multer should accept.
const VIDEO_EXTENSIONS: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export class MediaService {
  constructor(
    private repository: MediaRepository,
    private filesService: FilesService,
  ) {}

  // Reuses FilesService (the local-disk save pipeline) with a dedicated
  // 'contentImage' preset that only caps max width instead of hard-cropping
  // to a fixed square. `folder` organizes uploads on disk by what they're
  // for (e.g. "team", "global", "content") instead of everything landing
  // in one flat bucket — see UploadMediaDto's own comment on why it's
  // validated as strictly as it is.
  //
  // Video files skip the sharp/jpg pipeline entirely (savePublicRaw) since
  // sharp only understands image formats — saved as-is under their own
  // extension, with no width/height (no video-metadata probing here).
  async uploadAndCreate(buffer: Buffer, originalFilename: string, mimetype: string, altText?: string, folder?: string) {
    const folderPath = (folder || DEFAULT_FOLDER).toLowerCase();

    if (mimetype in VIDEO_EXTENSIONS) {
      const extension = VIDEO_EXTENSIONS[mimetype];
      const diskFilename = `${randomUUID()}.${extension}`;
      const storagePath = `${folderPath}/${diskFilename}`;
      const { path: savedPath } = await this.filesService.savePublicRaw(buffer, storagePath);

      return this.repository.create({
        fullName: originalFilename || diskFilename,
        fullPath: savedPath,
        altText: altText ?? null,
        mime: mimetype,
        extension,
        width: null,
        height: null,
      });
    }

    // Animated WebP for video reviews (folder "videos"): keep the file byte-for-byte so it still animates.
    if (mimetype === 'image/webp' && folderPath === 'videos') {
      const diskFilename = `${randomUUID()}.webp`;
      const { path: savedPath } = await this.filesService.savePublicRaw(buffer, `${folderPath}/${diskFilename}`);
      return this.repository.create({
        fullName: originalFilename || diskFilename,
        fullPath: savedPath,
        altText: altText ?? null,
        mime: 'image/webp',
        extension: 'webp',
        width: null,
        height: null,
      });
    }

    const diskFilename = `${randomUUID()}.webp`;
    const storagePath = `${folderPath}/${diskFilename}`;

    const { path: savedPath, width, height } = await this.filesService.savePublicImage(
      buffer,
      storagePath,
      'contentImage',
    );
    const extension = savedPath.split('.').pop() ?? null;

    return this.repository.create({
      fullName: originalFilename || diskFilename,
      fullPath: savedPath,
      altText: altText ?? null,
      mime: 'image/webp',
      extension,
      width,
      height,
    });
  }

  async findAll(dto: GetMediaDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where = {
      ...(dto.search ? { fullName: { contains: dto.search, mode: 'insensitive' as const } } : {}),
      ...(dto.type === 'video' ? { mime: { startsWith: 'video/' } } : {}),
      ...(dto.type === 'image' ? { NOT: { mime: { startsWith: 'video/' } } } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const media = await this.repository.findById(id);
    if (!media) throw new ApiError(404, 'Media not found');
    return media;
  }

  async update(id: string, dto: UpdateMediaDtoType) {
    await this.findById(id);
    return this.repository.update(id, dto);
  }

  async remove(id: string) {
    const media = await this.findById(id);
    // Attachments (package/page/blog photos, ...) reference media with ON DELETE RESTRICT — refuse up front
    // with a readable message instead of a 500, and before the file is removed from disk.
    const usages = await this.repository.countAttachments(id);
    if (usages > 0) {
      throw new ApiError(
        409,
        `This file is still used by ${usages} item${usages === 1 ? '' : 's'} (e.g. a package, page or blog). Remove it from there first, then delete it.`,
      );
    }
    // Row first, file second: if the database refuses, the file is never orphaned from its record.
    await this.repository.delete(id);
    await this.filesService.deleteFile(media.fullPath, 'public');
  }
}
