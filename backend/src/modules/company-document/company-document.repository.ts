import { Prisma, PrismaClient } from '@prisma/client';

// Plain CRUD — no urlInfo/meta/categories the way TeamMember or Testimonial
// have. Each row is a static grid card (title + description + image) on
// /company-documents, not a detail page, so there's no SEO surface per row.
export interface CompanyDocumentCoreFields {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: 'legal' | 'association';
  sortOrder?: number;
  isActive?: boolean;
}

export type CompanyDocumentCreateData = CompanyDocumentCoreFields;
export type CompanyDocumentUpdateData = Partial<CompanyDocumentCoreFields>;

export class CompanyDocumentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CompanyDocumentCreateData) {
    return this.prisma.companyDocument.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        imageUrl: data.imageUrl ?? null,
        category: data.category ?? 'legal',
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: CompanyDocumentUpdateData) {
    return this.prisma.companyDocument.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        category: data.category,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.companyDocument.findUnique({ where: { id } });
  }

  async findMany(where: Prisma.CompanyDocumentWhereInput, options?: { skip?: number; take?: number }) {
    return this.prisma.companyDocument.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      ...options,
    });
  }

  async count(where: Prisma.CompanyDocumentWhereInput) {
    return this.prisma.companyDocument.count({ where });
  }

  async softDelete(id: string) {
    return this.prisma.companyDocument.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
