import { DepartureRepository } from './departure.repository';
import { CreateDepartureDtoType, CreateDeparturesBulkDtoType, UpdateDepartureDtoType, GetDeparturesDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { revalidateFrontendTags } from '../../lib/revalidate-frontend';
import { packagePaths, packageTags } from '../package/package.service';

const REVALIDATE_TAG = 'departures';

export class DepartureService {
  constructor(private repository: DepartureRepository) {}

  // A package's public detail page (`/[slug]`) renders its departures in the
  // "Group Departure" table, and is cached under the package's own tags plus
  // a path-keyed HTML shell — the 'departures' tag alone (which only feeds
  // the homepage/last-minute widgets) never reached it, so a departure
  // added/edited/removed in admin stayed invisible on the trip page until
  // its 15-minute revalidate window elapsed. Same gap as
  // `AttachmentService.revalidateOwner` and PackageService (see their notes).
  private async revalidate(packageId: string) {
    const slug = await this.repository.findPackageSlug(packageId).catch(() => null);
    void revalidateFrontendTags([REVALIDATE_TAG, ...packageTags(slug)], packagePaths(slug));
  }

  private async assertPackageExists(packageId: string) {
    const pkg = await this.repository.packageExists(packageId);
    if (!pkg) throw new ApiError(400, 'Invalid packageId');
  }

  async create(dto: CreateDepartureDtoType) {
    await this.assertPackageExists(dto.packageId);
    const departure = await this.repository.create(dto);
    await this.revalidate(dto.packageId);
    return departure;
  }

  async createBulk(dto: CreateDeparturesBulkDtoType) {
    await this.assertPackageExists(dto.packageId);
    await this.repository.createMany(dto.departures.map((d) => ({ ...d, packageId: dto.packageId })));
    await this.revalidate(dto.packageId);
    return this.repository.findMany({ packageId: dto.packageId });
  }

  async findAll(dto: GetDeparturesDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where = {
      ...(dto.packageId ? { packageId: dto.packageId } : {}),
      ...(dto.departureStatus ? { departureStatus: dto.departureStatus } : {}),
      // "Last-minute deals" public consumption: only genuinely bookable,
      // not-yet-departed trips. Additive/opt-in — see GetDeparturesDto's
      // own comment on why this can't change default behavior.
      ...(dto.upcoming
        ? { departureDate: { gte: new Date() }, departureStatus: { not: 'closed' } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const departure = await this.repository.findById(id);
    if (!departure) throw new ApiError(404, 'Departure not found');
    return departure;
  }

  async update(id: string, dto: UpdateDepartureDtoType) {
    const existing = await this.findById(id);
    const departure = await this.repository.update(id, dto);
    await this.revalidate(existing.packageId);
    return departure;
  }

  async remove(id: string) {
    const existing = await this.findById(id);
    await this.repository.delete(id);
    await this.revalidate(existing.packageId);
  }
}
