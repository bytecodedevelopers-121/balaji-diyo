// src/modules/user/user.repository.ts
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

export interface CreateUserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roleId: string;
}

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatar: true,
  roleId: true,
  isSuperAdmin: true,
  isActive: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true } },
} as const;

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateUserInput) {
    const hashedPassword = await bcrypt.hash(data.password, 12);

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        roleId: data.roleId,
        isSuperAdmin: false,
        isActive: true,
      },
      select: userSelect,
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (user?.deletedAt) return null;
    return user;
  }

  async findByIdWithDeleted(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: userSelect });
  }

  async findByIdWithPassword(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // Batch lookup for enriching other modules' results with actor identity
  // (e.g. ActivityLog.loggerId). Includes soft-deleted users deliberately —
  // an audit log entry should still show who did it even if that account was
  // later removed.
  async findManyByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
  }

  async findAll(where: Prisma.UserWhereInput, options: { skip: number; take: number }) {
    return this.prisma.user.findMany({
      where: { ...where, deletedAt: null },
      select: userSelect,
      orderBy: { createdAt: 'desc' },
      ...options,
    });
  }

  async count(where: Prisma.UserWhereInput) {
    return this.prisma.user.count({ where: { ...where, deletedAt: null } });
  }

  async findDeleted() {
    return this.prisma.user.findMany({
      where: { deletedAt: { not: null } },
      select: userSelect,
      orderBy: { deletedAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  }

  async updatePassword(id: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: userSelect,
    });
  }

  async delete(id: string) {
    return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date() }, select: userSelect });
  }

  async restore(id: string) {
    return this.prisma.user.update({ where: { id }, data: { deletedAt: null }, select: userSelect });
  }
}
