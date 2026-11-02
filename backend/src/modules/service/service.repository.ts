import { Prisma, PrismaClient } from '@prisma/client';

export interface ServiceCoreFields {
  title: string;
  description: string;
  secondaryDescription?: string | null;
  imageUrl: string;
  ctaLabel?: string;
  ctaUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type ServiceCreateData = ServiceCoreFields;
export type ServiceUpdateData = Partial<ServiceCoreFields>;

export interface ServiceSectionConfigData {
  eyebrow: string;
  heading: string;
  introduction: string;
}

export class ServiceRepository {
  constructor(private prisma: PrismaClient) {}

  create(data: ServiceCreateData) {
    return this.prisma.service.create({
      data: {
        title: data.title,
        description: data.description,
        secondaryDescription: data.secondaryDescription ?? null,
        imageUrl: data.imageUrl,
        ctaLabel: data.ctaLabel ?? 'Know More',
        ctaUrl: data.ctaUrl ?? '/about-us',
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  update(id: string, data: ServiceUpdateData) {
    return this.prisma.service.update({ where: { id }, data });
  }

  findById(id: string) {
    return this.prisma.service.findUnique({ where: { id } });
  }

  findMany(where: Prisma.ServiceWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.service.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      ...options,
    });
  }

  count(where: Prisma.ServiceWhereInput) {
    return this.prisma.service.count({ where });
  }

  softDelete(id: string) {
    return this.prisma.service.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // This singleton is intentionally accessed through the generated Prisma
  // delegate so schema/client drift fails during startup verification rather
  // than silently falling back to unrelated global settings.
  findSectionConfig() {
    return this.prisma.serviceSectionConfig.findUnique({ where: { id: 'homepage-services' } });
  }

  updateSectionConfig(data: Partial<ServiceSectionConfigData>) {
    const defaults: ServiceSectionConfigData = {
      eyebrow: 'Services',
      heading: 'Everything We Take Care of',
      introduction:
        'From the first email to the final descent, every part of your journey is planned, permitted, and personally guided.',
    };

    return this.prisma.serviceSectionConfig.upsert({
      where: { id: 'homepage-services' },
      create: { id: 'homepage-services', ...defaults, ...data },
      update: data,
    });
  }
}
