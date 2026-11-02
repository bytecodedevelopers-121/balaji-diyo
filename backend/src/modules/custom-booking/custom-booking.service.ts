import { Prisma } from '@prisma/client';
import { CustomBookingRepository } from './custom-booking.repository';
import { CreateCustomBookingDtoType, GetCustomBookingsDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CustomBookingService {
  constructor(private repository: CustomBookingRepository) {}

  async create(dto: CreateCustomBookingDtoType, ipAddress?: string) {
    const pkg = await this.repository.packageExists(dto.packageId);
    if (!pkg) throw new ApiError(400, 'Invalid packageId');

    const { travellers, ...rest } = dto;

    try {
      return await this.repository.create({
        ...rest,
        ipAddress: ipAddress ?? null,
        travellers: travellers?.length ? { create: travellers.map((t) => ({ ...t, isActive: true })) } : undefined,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ApiError(400, 'Invalid packageId');
      }
      throw err;
    }
  }

  async findAll(dto: GetCustomBookingsDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.CustomBookingWhereInput = dto.packageId ? { packageId: dto.packageId } : {};

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const booking = await this.repository.findById(id);
    if (!booking) throw new ApiError(404, 'Custom booking not found');
    return booking;
  }
}
