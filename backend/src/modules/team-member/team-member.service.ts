import { Prisma } from '@prisma/client';
import { TeamMemberRepository } from './team-member.repository';
import { CreateTeamMemberDtoType, UpdateTeamMemberDtoType, GetTeamMembersDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { slugify } from '../../lib/slugify';
import { revalidateFrontendTags } from '../../lib/revalidate-frontend';

const REVALIDATE_TAG = 'team-members';

export class TeamMemberService {
  constructor(private repository: TeamMemberRepository) {}

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

  private async runWrite<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new ApiError(400, 'One or more referenced categories do not exist');
      }
      throw err;
    }
  }

  async create(dto: CreateTeamMemberDtoType) {
    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.fullName);
    const member = await this.runWrite(() => this.repository.create({ ...dto, slug }));
    void revalidateFrontendTags([REVALIDATE_TAG]);
    return member;
  }

  async findAll(dto: GetTeamMembersDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.TeamMemberWhereInput = {
      deletedAt: null,
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
      ...(dto.categoryId ? { categories: { some: { id: dto.categoryId } } } : {}),
      ...(dto.search ? { fullName: { contains: dto.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const member = await this.repository.findById(id);
    if (!member || member.deletedAt) throw new ApiError(404, 'Team member not found');
    return member;
  }

  async findPublicBySlug(slug: string) {
    const member = await this.repository.findBySlug(slug, { isActive: true, deletedAt: null });
    if (!member) throw new ApiError(404, 'Team member not found');
    return member;
  }

  async update(id: string, dto: UpdateTeamMemberDtoType) {
    const existing = await this.findById(id);
    const slug = dto.slug || dto.fullName ? await this.resolveUniqueSlug(dto.slug ?? dto.fullName!, id) : undefined;

    const member = await this.runWrite(() => this.repository.update(id, { ...dto, slug }));
    const memberSlug = member.slug ?? existing.slug;
    void revalidateFrontendTags(
      memberSlug ? [REVALIDATE_TAG, `team-member:${memberSlug}`] : [REVALIDATE_TAG],
    );
    return member;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.repository.softDelete(id);
    void revalidateFrontendTags([REVALIDATE_TAG]);
  }
}
