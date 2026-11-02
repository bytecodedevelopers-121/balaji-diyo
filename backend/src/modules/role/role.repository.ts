// src/modules/role/role.repository.ts
import { PrismaClient } from '@prisma/client';

export class RoleRepository {
    constructor(private prisma: PrismaClient) { }

    async create(data: any) {
        return this.prisma.role.create({
            data,
            include: { permissions: true },
        });
    }

    async findById(id: string) {
        return this.prisma.role.findUnique({
            where: { id },
            include: { permissions: true },
        });
    }

    async findMany(where: any, options?: { skip?: number; take?: number }) {
        return this.prisma.role.findMany({
            where,
            include: { permissions: true },
            orderBy: { createdAt: 'desc' },
            ...options,
        });
    }

    async update(id: string, data: any) {
        return this.prisma.role.update({
            where: { id },
            data,
            include: { permissions: true },
        });
    }

    async delete(id: string) {
        return this.prisma.role.delete({ where: { id } });
    }

    async count(where: any) {
        return this.prisma.role.count({ where });
    }

    async findAllPermissions() {
        return this.prisma.permission.findMany({
            orderBy: [{ subject: 'asc' }, { action: 'asc' }],
        });
    }
}