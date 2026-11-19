import { Prisma } from '@prisma/client';
import { PageSectionRepository } from './page-section.repository';
import type { SaveSectionDtoType } from './dto';
import { revalidateFrontendTags } from '../../lib/revalidate-frontend';

// Public URL(s) of each CMS page. The pages are cached, so a save must bust their cache by path
// as well as by tag, or the website keeps showing the old content until the cache expires.
const PAGE_PATHS: Record<string, string[]> = {
  site: ['/', '/contact'],
  home: ['/'],
  contact: ['/contact'],
  affiliate: ['/affiliate-program'],
  webstories: ['/travel-web-stories'],
  about: ['/company/about-us'],
  team: ['/company/team'],
  legal: ['/company/legal-documents'],
  plan: ['/plan-your-trip'],
  wishlist: ['/wishlist'],
  guided: ['/company/why-guided-travel'],
  responsible: ['/company/responsible-travel'],
  partner: ['/company/partner-with-us'],
  terms: ['/company/terms-and-conditions'],
  privacy: ['/company/privacy-policy'],
  footer: ['/'],
};

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

  async save(pageKey: string, sectionKey: string, dto: SaveSectionDtoType) {
    const saved = await this.repository.upsert(pageKey, sectionKey, dto.content as Prisma.InputJsonValue, dto.isActive);
    // Make the website show the change right away instead of after its cache window.
    void revalidateFrontendTags(['page-sections', `page-sections:${pageKey}`], PAGE_PATHS[pageKey] ?? []);
    return saved;
  }
}
