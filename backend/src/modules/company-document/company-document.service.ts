import { Prisma } from '@prisma/client';
import { CompanyDocumentRepository } from './company-document.repository';
import { CreateCompanyDocumentDtoType, UpdateCompanyDocumentDtoType, GetCompanyDocumentsDtoType } from './dto';
import { ApiError } from '../../common/exceptions/api-error';
import { PaginationDto, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { revalidateFrontendTags } from '../../lib/revalidate-frontend';

const REVALIDATE_TAG = 'company-documents';
// The public page is statically prerendered, so its HTML cache is keyed by path and needs busting too.
const REVALIDATE_PATHS = ['/company/legal-documents'];

export class CompanyDocumentService {
  constructor(private repository: CompanyDocumentRepository) {}

  async create(dto: CreateCompanyDocumentDtoType) {
    const document = await this.repository.create(dto);
    void revalidateFrontendTags([REVALIDATE_TAG], REVALIDATE_PATHS);
    return document;
  }

  async findAll(dto: GetCompanyDocumentsDtoType) {
    const pagination = new PaginationQueryDto({ page: dto.page, perPage: dto.perPage });
    const where: Prisma.CompanyDocumentWhereInput = {
      ...(dto.category ? { category: dto.category } : {}),
      deletedAt: null,
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.search ? { title: { contains: dto.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, { skip: pagination.skip, take: pagination.take }),
      this.repository.count(where),
    ]);

    return PaginationDto.create({ items, page: pagination.page, perPage: pagination.perPage, total });
  }

  async findById(id: string) {
    const document = await this.repository.findById(id);
    if (!document || document.deletedAt) throw new ApiError(404, 'Company document not found');
    return document;
  }

  async update(id: string, dto: UpdateCompanyDocumentDtoType) {
    await this.findById(id);
    const document = await this.repository.update(id, dto);
    void revalidateFrontendTags([REVALIDATE_TAG], REVALIDATE_PATHS);
    return document;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.repository.softDelete(id);
    void revalidateFrontendTags([REVALIDATE_TAG], REVALIDATE_PATHS);
  }
}
