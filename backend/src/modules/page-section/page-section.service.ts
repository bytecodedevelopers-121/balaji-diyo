import { Prisma } from '@prisma/client';
import { PageSectionRepository } from './page-section.repository';
import type { SaveSectionDtoType } from './dto';

export class PageSectionService {
  constructor(private repository: PageSectionRepository) {}

  /** Public map `{ [sectionKey]: { content, isActive } }` the website merges over its built-in defaults. */
  async getPublic(pageKey: string) {
    const rows = await this.repository.findByPage(pageKey);
    return Object.fromEntries(rows.map((r) => [r.sectionKey, { content: r.content, isActive: r.isActive }]));
  }

  getAdmin(pageKey: string) {
    return this.repository.findByPage(pageKey);
  }

  async listPages() {
    const groups = await this.repository.listPageKeys();
    return groups.map((g) => ({ pageKey: g.pageKey, sections: g._count._all }));
  }

  save(pageKey: string, sectionKey: string, dto: SaveSectionDtoType) {
    return this.repository.upsert(pageKey, sectionKey, dto.content as Prisma.InputJsonValue, dto.isActive);
  }
}
