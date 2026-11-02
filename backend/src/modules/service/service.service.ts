import { Prisma } from '@prisma/client';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ApiError } from '../../common/exceptions/api-error';
import { revalidateFrontendTags } from '../../lib/revalidate-frontend';
import type {
  CreateServiceDtoType,
  GetServicesDtoType,
  UpdateServiceDtoType,
  UpdateServiceSectionDtoType,
} from './dto';
import { ServiceRepository } from './service.repository';

const REVALIDATE_TAG = 'services';

export class ServiceService {
  constructor(private repository: ServiceRepository) {}

  async create(dto: CreateServiceDtoType) {
    const service = await this.repository.create(dto);
    void revalidateFrontendTags([REVALIDATE_TAG]);
    return service;
  }

  async findAll(dto: GetServicesDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.ServiceWhereInput = {
      deletedAt: null,
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.search
        ? {
            OR: [
              { title: { contains: dto.search, mode: 'insensitive' } },
              { description: { contains: dto.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findPublic() {
    const [section, items] = await Promise.all([
      this.findSectionConfig(),
      this.repository.findMany({ deletedAt: null, isActive: true }),
    ]);
    return { section, items };
  }

  async findSectionConfig() {
    return (
      (await this.repository.findSectionConfig()) ?? {
        id: 'homepage-services',
        eyebrow: 'Services',
        heading: 'Everything We Take Care of',
        introduction:
          'From the first email to the final descent, every part of your journey is planned, permitted, and personally guided.',
      }
    );
  }

  async updateSectionConfig(dto: UpdateServiceSectionDtoType) {
    const config = await this.repository.updateSectionConfig(dto);
    void revalidateFrontendTags([REVALIDATE_TAG]);
    return config;
  }

  async findById(id: string) {
    const service = await this.repository.findById(id);
    if (!service || service.deletedAt) throw new ApiError(404, 'Service not found');
    return service;
  }

  async update(id: string, dto: UpdateServiceDtoType) {
    await this.findById(id);
    const service = await this.repository.update(id, dto);
    void revalidateFrontendTags([REVALIDATE_TAG]);
    return service;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.repository.softDelete(id);
    void revalidateFrontendTags([REVALIDATE_TAG]);
  }
}
