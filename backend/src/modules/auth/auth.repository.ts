import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { RegisterDtoType } from './dto/register.dto';

export class AuthRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email, deletedAt: null },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  async updateLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async createUser(data: RegisterDtoType) {
    const hashedPassword = await bcrypt.hash(data.password, 12);

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        roleId: data.roleId,
        isSuperAdmin: data.isSuperAdmin || false,
        isActive: true,
      },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });
  }
}