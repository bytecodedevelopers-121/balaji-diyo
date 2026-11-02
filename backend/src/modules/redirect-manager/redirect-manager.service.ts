import { Prisma } from '@prisma/client';
import { RedirectManagerRepository } from './redirect-manager.repository';
import { CreateRedirectDtoType, CreateRedirectsBulkDtoType, UpdateRedirectDtoType, GetRedirectsDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import {
  isValidRedirectSource,
  normalizeRedirectSource,
  redirectSourceCandidates,
} from './redirect-manager.utils';

export class RedirectManagerService {
  constructor(private repository: RedirectManagerRepository) {}

  private async runWrite<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ApiError(409, 'A redirect for this source path already exists');
      }
      throw err;
    }
  }

  async create(dto: CreateRedirectDtoType) {
    return this.runWrite(() => this.repository.create(dto));
  }

  async createBulk(dto: CreateRedirectsBulkDtoType) {
    await this.repository.createMany(dto.redirects);
    const sources = dto.redirects.map((r) => r.source);
    return this.repository.findMany({ source: { in: sources } });
  }

  async findAll(dto: GetRedirectsDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.RedirectManagerWhereInput = dto.search
      ? { OR: [{ source: { contains: dto.search, mode: 'insensitive' } }, { destination: { contains: dto.search, mode: 'insensitive' } }] }
      : {};

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const redirect = await this.repository.findById(id);
    if (!redirect) throw new ApiError(404, 'Redirect not found');
    return redirect;
  }

  // Public — Next.js Proxy calls this before rendering page routes.
  async resolve(source: string) {
    if (source.length > 255 || !isValidRedirectSource(source)) return null;

    const candidates = redirectSourceCandidates(source);
    const redirects = await this.repository.findBySources(candidates);
    const redirect = candidates
      .map((candidate) => redirects.find((item) => item.source === candidate))
      .find(Boolean);
    if (!redirect || !redirect.redirectStatus) return null;

    // Do not emit a redirect loop even if an old imported row contains one.
    if (normalizeRedirectSource(redirect.destination) === normalizeRedirectSource(source)) {
      return null;
    }

    return {
      destination: redirect.destination,
      isPermanent: redirect.isPermanent,
    };
  }

  async update(id: string, dto: UpdateRedirectDtoType) {
    await this.findById(id);
    return this.runWrite(() => this.repository.update(id, dto));
  }

  async remove(id: string) {
    await this.findById(id);
    await this.repository.delete(id);
  }

  async bulkRemove(ids: string[]) {
    await this.repository.bulkDelete(ids);
  }
}
