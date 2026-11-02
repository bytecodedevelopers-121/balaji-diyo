import { Prisma, PrismaClient } from '@prisma/client';

export interface LogEntryInput {
  loggerType: string;
  loggerId: string;
  primaryAction?: string;
  clientAction?: string;
  actionMethod?: string;
  actionData?: unknown;
  actionResponse?: unknown;
  actionCategory?: string;
  actionCategoryKey?: string;
  actionCategoryId?: string;
  actionTitle?: string;
  actionKey?: string;
}

export class ActivityLogRepository {
  constructor(private prisma: PrismaClient) {}

  // Intended for other services to call directly (constructor-inject this
  // repository) once they want audit logging — no module currently calls it.
  log(entry: LogEntryInput) {
    return this.prisma.activityLog.create({
      data: entry as Prisma.ActivityLogUncheckedCreateInput,
    });
  }

  findById(id: string) {
    return this.prisma.activityLog.findUnique({ where: { id } });
  }

  findMany(where: Prisma.ActivityLogWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, ...options });
  }

  count(where: Prisma.ActivityLogWhereInput) {
    return this.prisma.activityLog.count({ where });
  }
}
