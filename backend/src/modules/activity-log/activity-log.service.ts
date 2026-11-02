import { Prisma } from '@prisma/client';
import { ActivityLogRepository } from './activity-log.repository';
import { UserRepository } from '../user/user.repository';
import { GetActivityLogsDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';

interface ActorRef {
  id: string;
  name: string | null;
  email: string;
}

export class ActivityLogService {
  constructor(
    private repository: ActivityLogRepository,
    private userRepository: UserRepository,
  ) {}

  // `loggerId` has no formal Prisma relation to User (ActivityLog.loggerId is
  // a bare string, not a foreign key — it's written by whatever service logs
  // the event, and "user" loggerType entries may not even correspond to a
  // User row). So this can't be a Prisma `include`; resolve it as a separate
  // batch lookup and merge in an `actor` field, admin-type entries only.
  private async withActors<T extends { loggerType: string; loggerId: string }>(logs: T[]) {
    const adminIds = [...new Set(logs.filter((l) => l.loggerType === 'admin').map((l) => l.loggerId))];
    const users = adminIds.length > 0 ? await this.userRepository.findManyByIds(adminIds) : [];
    const byId = new Map(
      users.map((u): [string, ActorRef] => [
        u.id,
        { id: u.id, name: [u.firstName, u.lastName].filter(Boolean).join(' ') || null, email: u.email },
      ]),
    );

    return logs.map((log) => ({ ...log, actor: log.loggerType === 'admin' ? (byId.get(log.loggerId) ?? null) : null }));
  }

  async findAll(dto: GetActivityLogsDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.ActivityLogWhereInput = {
      ...(dto.loggerType ? { loggerType: dto.loggerType } : {}),
      ...(dto.loggerId ? { loggerId: dto.loggerId } : {}),
      ...(dto.actionCategory ? { actionCategory: dto.actionCategory } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items: await this.withActors(items), page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const log = await this.repository.findById(id);
    if (!log) throw new ApiError(404, 'Activity log not found');
    const [withActor] = await this.withActors([log]);
    return withActor;
  }
}
