import { Prisma } from '@prisma/client';
import { TripInfoRepository } from './trip-info.repository';
import { CreateTripInfoDtoType, UpdateTripInfoDtoType, GetTripInfosDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { slugify } from '../../lib/slugify';

export class TripInfoService {
  constructor(private repository: TripInfoRepository) {}

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

  async create(dto: CreateTripInfoDtoType) {
    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.title);
    return this.repository.create({ ...dto, slug });
  }

  async findAll(dto: GetTripInfosDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.TripInfoWhereInput = {
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.search ? { title: { contains: dto.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const tripInfo = await this.repository.findById(id);
    if (!tripInfo) throw new ApiError(404, 'Trip info not found');
    return tripInfo;
  }

  async update(id: string, dto: UpdateTripInfoDtoType) {
    await this.findById(id);
    const slug = dto.slug || dto.title ? await this.resolveUniqueSlug(dto.slug ?? dto.title!, id) : undefined;

    return this.repository.update(id, { ...dto, slug });
  }

  async remove(id: string) {
    await this.findById(id);

    const inUse = await this.repository.countPackages(id);
    if (inUse > 0) throw new ApiError(409, `Cannot delete: ${inUse} packages still reference this trip info`);

    await this.repository.delete(id);
  }
}
